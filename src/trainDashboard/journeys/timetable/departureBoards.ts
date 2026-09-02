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
    const onwardBoards = await Promise.all(
        stationRoutes.map(async (route) => {
            if (!route.viaCrs) {
                return;
            }

            const canonicalRequest = {
                originCrs: route.viaCrs,
                destinationCrs: route.destination.crs,
                timeOffsetMinutes: 0,
            };
            const canonicalKey = getRequestKey(canonicalRequest);
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
            const transferReadyTimes = Array.from(
                new Set(
                    firstTrainLegs.map(
                        (trainLeg) => trainLeg.arrival + minimumTransferMinutes
                    )
                )
            ).sort((first, second) => first - second);

            return {
                canonicalKey,
                board: await fetchOnwardDepartureBoards(
                    consumerKey,
                    canonicalRequest,
                    transferReadyTimes,
                    currentMinutes,
                    requestCache
                ),
            };
        })
    );

    onwardBoards.forEach((result) => {
        if (!result) {
            return;
        }

        departureBoards.set(
            result.canonicalKey,
            mergeDepartureBoards(
                departureBoards.get(result.canonicalKey) ?? {
                    crs: result.board.crs,
                    trainServices: [],
                },
                result.board
            )
        );
    });

    return departureBoards;
}

async function fetchOnwardDepartureBoards(
    consumerKey: string,
    canonicalRequest: DepartureBoardRequest,
    transferReadyTimes: number[],
    currentMinutes: number,
    requestCache: DepartureBoardRequestCache
): Promise<DepartureBoard> {
    let departureBoard: DepartureBoard = {
        crs: canonicalRequest.originCrs,
        trainServices: [],
    };
    let nextTransferReadyTime = transferReadyTimes.at(0);

    while (nextTransferReadyTime !== undefined) {
        const request = {
            ...canonicalRequest,
            timeOffsetMinutes: Math.min(
                Math.max(nextTransferReadyTime - currentMinutes, 0),
                maximumTimeOffsetMinutes
            ),
        };
        const boards = await fetchDepartureBoards(
            consumerKey,
            [request],
            requestCache
        );
        const board = boards.get(getRequestKey(request))!;

        departureBoard = mergeDepartureBoards(departureBoard, board);

        const latestOnwardDeparture = getDirectTrainLegs(
            board,
            canonicalRequest.originCrs,
            canonicalRequest.destinationCrs,
            currentMinutes
        ).at(-1)?.departure;
        const coveredUntil = Math.max(
            nextTransferReadyTime,
            latestOnwardDeparture ?? nextTransferReadyTime
        );

        nextTransferReadyTime = transferReadyTimes.find(
            (transferReadyTime) => transferReadyTime > coveredUntil
        );
    }

    return departureBoard;
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
