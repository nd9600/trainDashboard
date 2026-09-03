import {fetchDepartureBoard} from "../../api/railDataMarketplace.api";
import type {
    DepartureBoard,
    DepartureService,
} from "../../dto/liveDepartureBoard.dto";
import type {TrainLeg} from "../../dto/timetabledJourney.dto";
import type {JourneyRoute} from "../planning/journeyRoutes";
import {getDirectTrainLegs, minimumTransferMinutes} from "./trainLegs";

export type DepartureBoards = Map<string, DepartureBoard>;
type DepartureBoardRequestCache = Map<string, Promise<DepartureBoard>>;

interface DepartureBoardRequest {
    originCrs: string;
    destinationCrs: string;
    timeOffsetMinutes: number;
}

interface KeyedDepartureBoardRequest {
    canonicalKey: string;
    request: DepartureBoardRequest;
}

interface KeyedDepartureBoard {
    canonicalKey: string;
    board: DepartureBoard;
}

const maximumTimeOffsetMinutes = 119;
const minimumFirstTrainCount = 6;

export async function getDepartureBoards(
    consumerKey: string,
    stationRoutes: JourneyRoute[],
    currentMinutes: number
): Promise<DepartureBoards> {
    const requestCache: DepartureBoardRequestCache = new Map();
    const departureBoards = await fetchDepartureBoards(
        consumerKey,
        getFirstDepartureBoardRequests(stationRoutes),
        requestCache
    );
    const laterFirstBoardRequests = stationRoutes.flatMap((route) =>
        getLaterFirstBoardRequests(route, departureBoards, currentMinutes)
    );
    const laterFirstBoards = await fetchDepartureBoards(
        consumerKey,
        laterFirstBoardRequests.map(({request}) => request),
        requestCache
    );

    for (const {canonicalKey, request} of laterFirstBoardRequests) {
        departureBoards.set(
            canonicalKey,
            mergeDepartureBoards(
                departureBoards.get(canonicalKey)!,
                laterFirstBoards.get(getRequestKey(request))!
            )
        );
    }

    const onwardBoards = await Promise.all(
        stationRoutes.map((route) =>
            fetchOnwardBoardForRoute(
                consumerKey,
                route,
                departureBoards,
                currentMinutes,
                requestCache
            )
        )
    );

    for (const result of onwardBoards) {
        if (!result) {
            continue;
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
    }

    return departureBoards;
}

function getLaterFirstBoardRequests(
    route: JourneyRoute,
    departureBoards: DepartureBoards,
    currentMinutes: number
): KeyedDepartureBoardRequest[] {
    if (
        !route.viaCrs ||
        getCatchableFirstTrainLegs(route, departureBoards, currentMinutes)
            .length >= minimumFirstTrainCount
    ) {
        return [];
    }

    const firstRequest = getFirstDepartureBoardRequest(route);

    if (firstRequest.timeOffsetMinutes >= maximumTimeOffsetMinutes) {
        return [];
    }

    return [
        {
            canonicalKey: getRequestKey(firstRequest),
            request: {
                ...firstRequest,
                timeOffsetMinutes: maximumTimeOffsetMinutes,
            },
        },
    ];
}

async function fetchOnwardBoardForRoute(
    consumerKey: string,
    route: JourneyRoute,
    departureBoards: DepartureBoards,
    currentMinutes: number,
    requestCache: DepartureBoardRequestCache
): Promise<KeyedDepartureBoard | undefined> {
    if (!route.viaCrs) {
        return;
    }

    const canonicalRequest = {
        originCrs: route.viaCrs,
        destinationCrs: route.destination.crs,
        timeOffsetMinutes: 0,
    };
    const firstTrainLegs = getCatchableFirstTrainLegs(
        route,
        departureBoards,
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
        canonicalKey: getRequestKey(canonicalRequest),
        board: await fetchOnwardDepartureBoards(
            consumerKey,
            canonicalRequest,
            transferReadyTimes,
            currentMinutes,
            requestCache
        ),
    };
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
        Array.from(uniqueRequests, ([key, request]) =>
            fetchRequestedDepartureBoard(
                consumerKey,
                key,
                request,
                requestCache
            )
        )
    );

    return new Map(boards);
}

async function fetchRequestedDepartureBoard(
    consumerKey: string,
    key: string,
    request: DepartureBoardRequest,
    requestCache: DepartureBoardRequestCache
): Promise<readonly [string, DepartureBoard]> {
    let boardRequest = requestCache.get(key);

    if (!boardRequest) {
        boardRequest = fetchDepartureBoard(consumerKey, {
            ...request,
            numberOfRows: 10,
            timeWindowMinutes: 120,
        });
        requestCache.set(key, boardRequest);
    }

    return [key, await boardRequest];
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
    return stationRoutes.map(getFirstDepartureBoardRequest);
}

function getFirstDepartureBoardRequest(
    route: JourneyRoute
): DepartureBoardRequest {
    return {
        originCrs: route.origin.crs,
        destinationCrs: route.viaCrs ?? route.destination.crs,
        timeOffsetMinutes: route.origin.walkMinutes ?? 0,
    };
}

function getCatchableFirstTrainLegs(
    route: JourneyRoute,
    departureBoards: DepartureBoards,
    currentMinutes: number
): TrainLeg[] {
    const firstRequest = getFirstDepartureBoardRequest(route);

    return getDirectTrainLegs(
        getDepartureBoard(
            departureBoards,
            firstRequest.originCrs,
            firstRequest.destinationCrs,
            firstRequest.timeOffsetMinutes
        ),
        firstRequest.originCrs,
        firstRequest.destinationCrs,
        currentMinutes
    ).filter(
        (trainLeg) =>
            trainLeg.departure - firstRequest.timeOffsetMinutes >=
            currentMinutes
    );
}

function getRequestKey(request: DepartureBoardRequest): string {
    return `${request.originCrs}-${request.destinationCrs}:${request.timeOffsetMinutes}`;
}

function mergeDepartureBoards(
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
