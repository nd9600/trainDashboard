import type {DepartureBoard} from "../../dto/liveDepartureBoard.dto";
import type {TrainLeg} from "../../dto/timetabledJourney.dto";
import type {JourneyRoute} from "../planning/journeyRoutes";
import {
    maximumTimeOffsetMinutes,
    mergeDepartureBoards,
    type LoadDepartureBoard,
} from "./departureBoards";
import {getDirectTrainLegs, minimumTransferMinutes} from "./trainLegs";

export async function loadOnwardDepartureBoard(
    route: JourneyRoute,
    firstTrainLegs: TrainLeg[],
    currentMinutes: number,
    loadDepartureBoard: LoadDepartureBoard
): Promise<DepartureBoard | undefined> {
    if (!route.viaCrs) {
        return undefined;
    }

    const transferReadyTimes = [
        ...new Set(firstTrainLegs.map((leg) => leg.arrival + minimumTransferMinutes)),
    ].sort((first, second) => first - second);
    let combinedBoard: DepartureBoard = {crs: route.viaCrs, trainServices: []};
    let nextTransferReadyTime = transferReadyTimes.at(0);

    while (nextTransferReadyTime !== undefined) {
        const request = {
            originCrs: route.viaCrs,
            destinationCrs: route.destination.crs,
            timeOffsetMinutes: Math.min(
                Math.max(nextTransferReadyTime - currentMinutes, 0),
                maximumTimeOffsetMinutes
            ),
        };
        const board = await loadDepartureBoard(request);
        combinedBoard = mergeDepartureBoards(combinedBoard, board);

        const latestOnwardDeparture = getDirectTrainLegs(
            board,
            request.originCrs,
            request.destinationCrs,
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

    return combinedBoard;
}
