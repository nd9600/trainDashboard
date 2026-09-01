import {fetchDepartureBoard} from "../../api/railDataMarketplace.api";
import type {
    DepartureBoard,
    DepartureService,
} from "../../dto/liveDepartureBoard.dto";
import type {JourneyRoute} from "../planning/journeyRoutes";
import {getDirectTrainLegs, minimumTransferMinutes} from "./trainLegs";

export type DepartureBoards = Map<string, DepartureBoard>;
export type DepartureBoardRequestCache = Map<string, Promise<DepartureBoard>>;

interface DepartureBoardRequest {
    originCrs: string;
    destinationCrs: string;
    timeOffsetMinutes: number;
}

const maximumTimeOffsetMinutes = 119;

export async function getDepartureBoards(
    consumerKey: string,
    stationRoutes: JourneyRoute[],
    currentMinutes: number,
    requestCache: DepartureBoardRequestCache = new Map()
): Promise<DepartureBoards> {
    const departureBoards = await fetchDepartureBoards(
        consumerKey,
        getFirstDepartureBoardRequests(stationRoutes),
        requestCache
    );
    const onwardRequests = stationRoutes.flatMap((route) => {
        if (!route.viaCrs) {
            return [];
        }

        const canonicalRequest = {
            originCrs: route.viaCrs,
            destinationCrs: route.destination.crs,
            timeOffsetMinutes: 0,
        };
        const canonicalKey = getRequestKey(canonicalRequest);

        if (!departureBoards.has(canonicalKey)) {
            departureBoards.set(canonicalKey, {
                crs: route.viaCrs,
                trainServices: [],
            });
        }

        const firstTrainLegs = getDirectTrainLegs(
            getDepartureBoard(
                departureBoards,
                route.origin.crs,
                route.viaCrs,
                route.origin.walkMinutes ?? 0
            ),
            route.origin.crs,
            route.viaCrs,
            currentMinutes
        ).filter(
            (trainLeg) =>
                trainLeg.departure - (route.origin.walkMinutes ?? 0) >=
                currentMinutes
        );
        const earliestArrival = Math.min(
            ...firstTrainLegs.map((trainLeg) => trainLeg.arrival)
        );

        if (!Number.isFinite(earliestArrival)) {
            return [];
        }

        return [
            {
                canonicalKey,
                request: {
                    ...canonicalRequest,
                    timeOffsetMinutes: Math.min(
                        Math.max(
                            earliestArrival +
                                minimumTransferMinutes -
                                currentMinutes,
                            0
                        ),
                        maximumTimeOffsetMinutes
                    ),
                },
            },
        ];
    });
    const onwardBoards = await fetchDepartureBoards(
        consumerKey,
        onwardRequests.map(({request}) => request),
        requestCache
    );

    onwardRequests.forEach(({canonicalKey, request}) => {
        const onwardBoard = onwardBoards.get(getRequestKey(request));

        if (onwardBoard) {
            departureBoards.set(
                canonicalKey,
                mergeDepartureBoards(
                    departureBoards.get(canonicalKey)!,
                    onwardBoard
                )
            );
        }
    });

    return departureBoards;
}

async function fetchDepartureBoards(
    consumerKey: string,
    requests: DepartureBoardRequest[],
    requestCache: DepartureBoardRequestCache
): Promise<DepartureBoards> {
    const uniqueRequests = new Map(
        requests.map((request) => [getRequestKey(request), request])
    );
    const boards = await Promise.all(
        Array.from(uniqueRequests, async ([key, request]) => {
            let boardRequest = requestCache.get(key);

            if (!boardRequest) {
                boardRequest = fetchDepartureBoard(consumerKey, {
                    ...request,
                    numberOfRows: 10,
                    timeWindowMinutes: 120,
                });
                requestCache.set(key, boardRequest);
            }

            return [key, await boardRequest] as const;
        })
    );

    return new Map(boards);
}

export function getDepartureBoard(
    departureBoards: DepartureBoards,
    originCrs: string,
    destinationCrs: string,
    timeOffsetMinutes: number
): DepartureBoard {
    return departureBoards.get(
        getRequestKey({originCrs, destinationCrs, timeOffsetMinutes})
    )!;
}

function getFirstDepartureBoardRequests(
    stationRoutes: JourneyRoute[]
): DepartureBoardRequest[] {
    return stationRoutes.map((route) => ({
        originCrs: route.origin.crs,
        destinationCrs: route.viaCrs ?? route.destination.crs,
        timeOffsetMinutes: route.origin.walkMinutes ?? 0,
    }));
}

function getRequestKey(request: DepartureBoardRequest): string {
    return `${request.originCrs}-${request.destinationCrs}:${request.timeOffsetMinutes}`;
}

function mergeDepartureBoards(
    firstBoard: DepartureBoard,
    secondBoard: DepartureBoard
): DepartureBoard {
    const services = new Map<string, DepartureService>();

    [...firstBoard.trainServices, ...secondBoard.trainServices].forEach(
        (service) => {
            services.set(`${service.serviceID}:${service.std}`, service);
        }
    );

    return {
        ...firstBoard,
        trainServices: Array.from(services.values()),
    };
}
