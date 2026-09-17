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
    const requests = routes.map((route) => ({
        originCrs: route.origin.crs,
        destinationCrs: route.viaCrs ?? route.destination.crs,
        timeOffsetMinutes: route.origin.walkMinutes ?? 0,
    }));
    const boards = await Promise.all(requests.map(loadDepartureBoard));
    return Promise.all(
        routes.map(async (route, index) => {
            const request = requests[index]!;
            let board = boards[index]!;
            let firstTrainLegs = getCatchableTrainLegs(board, request, currentMinutes);
            if (
                route.viaCrs &&
                firstTrainLegs.length < minimumFirstTrainCount &&
                request.timeOffsetMinutes < maximumTimeOffsetMinutes
            ) {
                const laterBoard = await loadDepartureBoard({
                    ...request,
                    timeOffsetMinutes: maximumTimeOffsetMinutes,
                });
                board = mergeDepartureBoards(board, laterBoard);
                firstTrainLegs = getCatchableTrainLegs(board, request, currentMinutes);
            }
            return {route, firstTrainLegs};
        })
    );
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
    ).filter((trainLeg) => trainLeg.departure - request.timeOffsetMinutes >= currentMinutes);
}
