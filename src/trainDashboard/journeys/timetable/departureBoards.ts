import {fetchDepartureBoard} from "../../api/railDataMarketplace.api";
import type {DepartureBoard} from "../../dto/liveDepartureBoard.dto";
import type {JourneyRoute} from "../planning/journeyRoutes";

export type DepartureBoards = Map<string, DepartureBoard>;
export type DepartureBoardRequestCache = Map<string, Promise<DepartureBoard>>;

interface DepartureBoardRequest {
    originCrs: string;
    destinationCrs: string;
    timeOffsetMinutes: number;
}

export async function getDepartureBoards(
    consumerKey: string,
    stationRoutes: JourneyRoute[],
    requestCache: DepartureBoardRequestCache = new Map()
): Promise<DepartureBoards> {
    const requests = getDepartureBoardRequests(stationRoutes);
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

function getDepartureBoardRequests(
    stationRoutes: JourneyRoute[]
): DepartureBoardRequest[] {
    return stationRoutes.flatMap((route) => {
        const firstRequest = {
            originCrs: route.origin.crs,
            destinationCrs: route.viaCrs ?? route.destination.crs,
            timeOffsetMinutes: route.origin.walkMinutes ?? 0,
        };

        return route.viaCrs
            ? [
                  firstRequest,
                  {
                      originCrs: route.viaCrs,
                      destinationCrs: route.destination.crs,
                      timeOffsetMinutes: 0,
                  },
              ]
            : [firstRequest];
    });
}

function getRequestKey(request: DepartureBoardRequest): string {
    return `${request.originCrs}-${request.destinationCrs}:${request.timeOffsetMinutes}`;
}
