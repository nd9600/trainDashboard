import type {DepartureBoard} from "../../dto/liveDepartureBoard.dto";
import type {TrainLeg} from "../../dto/timetabledJourney.dto";
import type {JourneyRoute} from "../planning/journeyRoutes";
import {
    createDepartureBoardLoader,
    mergeDepartureBoards,
} from "./departureBoards";
import {
    loadFirstTrainsForRoutes,
    type RouteFirstTrains,
} from "./firstTrainRequests";
import {loadOnwardDepartureBoard} from "./onwardTrainRequests";
import {getDirectTrainLegs} from "./trainLegs";

export interface RouteTimetable {
    route: JourneyRoute;
    firstTrainLegs: TrainLeg[];
    onwardTrainLegs?: TrainLeg[];
}

export async function loadRouteTimetables(
    consumerKey: string,
    stationRoutes: JourneyRoute[],
    currentMinutes: number
): Promise<RouteTimetable[]> {
    const loadDepartureBoard = createDepartureBoardLoader(consumerKey);
    const firstTrains = await loadFirstTrainsForRoutes(
        stationRoutes,
        currentMinutes,
        loadDepartureBoard
    );

    const onwardBoards = await Promise.all(
        firstTrains.map(({route, firstTrainLegs}) =>
            loadOnwardDepartureBoard(
                route,
                firstTrainLegs,
                currentMinutes,
                loadDepartureBoard
            )
        )
    );

    return makeRouteTimetables(firstTrains, onwardBoards, currentMinutes);
}

function makeRouteTimetables(
    firstTrains: RouteFirstTrains[],
    onwardBoards: Array<DepartureBoard | undefined>,
    currentMinutes: number
): RouteTimetable[] {
    const onwardBoardsByStationPair = new Map<string, DepartureBoard>();

    for (const [index, {route}] of firstTrains.entries()) {
        const board = onwardBoards[index];

        if (!route.viaCrs || !board) {
            continue;
        }

        const key = getStationPairKey(route.viaCrs, route.destination.crs);
        const existingBoard = onwardBoardsByStationPair.get(key) ?? {
            crs: route.viaCrs,
            trainServices: [],
        };
        onwardBoardsByStationPair.set(
            key,
            mergeDepartureBoards(existingBoard, board)
        );
    }

    return firstTrains.map(({route, firstTrainLegs}) => {
        if (!route.viaCrs) {
            return {route, firstTrainLegs};
        }

        const onwardBoard = onwardBoardsByStationPair.get(
            getStationPairKey(route.viaCrs, route.destination.crs)
        )!;
        const onwardTrainLegs = getDirectTrainLegs(
            onwardBoard,
            route.viaCrs,
            route.destination.crs,
            currentMinutes
        );

        return {route, firstTrainLegs, onwardTrainLegs};
    });
}

function getStationPairKey(originCrs: string, destinationCrs: string): string {
    return `${originCrs}-${destinationCrs}`;
}
