import type {DepartureBoard} from "../../dto/liveDepartureBoard.dto";
import type {TrainLeg} from "../../dto/timetabledJourney.dto";
import type {JourneyRoute} from "../planning/journeyRoutes";
import {
    maximumTimeOffsetMinutes,
    mergeDepartureBoards,
    type DepartureBoardRequest,
    type LoadDepartureBoard,
} from "./departureBoards";
import {getDirectTrainLegs} from "./trainLegs";

export interface RouteFirstTrains {
    route: JourneyRoute;
    firstTrainLegs: TrainLeg[];
}

const minimumFirstTrainCount = 6;

export async function loadFirstTrainsForRoutes(
    routes: JourneyRoute[],
    currentMinutes: number,
    loadDepartureBoard: LoadDepartureBoard
): Promise<RouteFirstTrains[]> {
    const initialBoards = await Promise.all(
        routes.map((route) =>
            loadDepartureBoard(getFirstDepartureBoardRequest(route))
        )
    );

    return Promise.all(
        routes.map((route, index) =>
            loadFirstTrains(
                route,
                initialBoards[index]!,
                currentMinutes,
                loadDepartureBoard
            )
        )
    );
}

async function loadFirstTrains(
    route: JourneyRoute,
    initialBoard: DepartureBoard,
    currentMinutes: number,
    loadDepartureBoard: LoadDepartureBoard
): Promise<RouteFirstTrains> {
    const firstRequest = getFirstDepartureBoardRequest(route);
    const initialTrainLegs = getCatchableTrainLegs(
        initialBoard,
        firstRequest,
        currentMinutes
    );

    if (
        !route.viaCrs ||
        initialTrainLegs.length >= minimumFirstTrainCount ||
        firstRequest.timeOffsetMinutes >= maximumTimeOffsetMinutes
    ) {
        return {route, firstTrainLegs: initialTrainLegs};
    }

    const laterBoard = await loadDepartureBoard({
        ...firstRequest,
        timeOffsetMinutes: maximumTimeOffsetMinutes,
    });
    const combinedBoard = mergeDepartureBoards(initialBoard, laterBoard);

    return {
        route,
        firstTrainLegs: getCatchableTrainLegs(
            combinedBoard,
            firstRequest,
            currentMinutes
        ),
    };
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

function getCatchableTrainLegs(
    board: DepartureBoard,
    request: DepartureBoardRequest,
    currentMinutes: number
): TrainLeg[] {
    return getDirectTrainLegs(
        board,
        request.originCrs,
        request.destinationCrs,
        currentMinutes
    ).filter(
        (trainLeg) =>
            trainLeg.departure - request.timeOffsetMinutes >= currentMinutes
    );
}
