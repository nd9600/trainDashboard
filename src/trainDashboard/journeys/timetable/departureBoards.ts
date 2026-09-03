import {fetchDepartureBoard} from "../../api/railDataMarketplace.api";
import type {
    DepartureBoard,
    DepartureService,
} from "../../dto/liveDepartureBoard.dto";

export interface DepartureBoardRequest {
    originCrs: string;
    destinationCrs: string;
    timeOffsetMinutes: number;
}

export type LoadDepartureBoard = (
    request: DepartureBoardRequest
) => Promise<DepartureBoard>;

export const maximumTimeOffsetMinutes = 119;

export function createDepartureBoardLoader(
    consumerKey: string
): LoadDepartureBoard {
    const requestCache = new Map<string, Promise<DepartureBoard>>();

    return (request) => {
        const key = getRequestKey(request);
        let boardRequest = requestCache.get(key);

        if (!boardRequest) {
            boardRequest = fetchDepartureBoard(consumerKey, {
                ...request,
                numberOfRows: 10,
                timeWindowMinutes: 120,
            });
            requestCache.set(key, boardRequest);
        }

        return boardRequest;
    };
}

export function mergeDepartureBoards(
    firstBoard: DepartureBoard,
    secondBoard: DepartureBoard
): DepartureBoard {
    const services = new Map<string, DepartureService>();

    for (const service of [
        ...firstBoard.trainServices,
        ...secondBoard.trainServices,
    ]) {
        services.set(`${service.serviceID}:${service.std}`, service);
    }

    return {
        ...firstBoard,
        trainServices: Array.from(services.values()),
    };
}

function getRequestKey(request: DepartureBoardRequest): string {
    return `${request.originCrs}-${request.destinationCrs}:${request.timeOffsetMinutes}`;
}
