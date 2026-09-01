import type {TrainLeg} from "../../dto/timetabledJourney.dto";
import type {JourneyRoute} from "../planning/journeyRoutes";
import {getDepartureBoard, type DepartureBoards} from "./departureBoards";
import {getDirectTrainLegs, minimumTransferMinutes} from "./trainLegs";

export interface TrainOption {
    route: JourneyRoute;
    trainLegs: TrainLeg[];
}

export function getTrainOptions(
    stationRoutes: JourneyRoute[],
    departureBoards: DepartureBoards,
    currentMinutes: number
): TrainOption[] {
    return stationRoutes.flatMap((route) => {
        if (!route.viaCrs) {
            const board = getDepartureBoard(
                departureBoards,
                route.origin.crs,
                route.destination.crs,
                route.origin.walkMinutes ?? 0
            );

            return getDirectTrainLegs(
                board,
                route.origin.crs,
                route.destination.crs,
                currentMinutes
            ).map((leg) => ({
                route,
                trainLegs: [leg],
            }));
        }

        return getConnectionOptions(route, departureBoards, currentMinutes);
    });
}

function getConnectionOptions(
    route: JourneyRoute,
    departureBoards: DepartureBoards,
    currentMinutes: number
): TrainOption[] {
    const viaCrs = route.viaCrs!;
    const firstTrainLegs = getDirectTrainLegs(
        getDepartureBoard(
            departureBoards,
            route.origin.crs,
            viaCrs,
            route.origin.walkMinutes ?? 0
        ),
        route.origin.crs,
        viaCrs,
        currentMinutes
    );
    const onwardTrainLegs = getDirectTrainLegs(
        getDepartureBoard(departureBoards, viaCrs, route.destination.crs, 0),
        viaCrs,
        route.destination.crs,
        currentMinutes
    );

    // 1. Consider every catchable onward train.
    const connectionOptions = onwardTrainLegs.flatMap((onwardTrainLeg) => {
        // 2. Require at least three minutes to change trains.
        // 3. Use the latest catchable first train.
        const orderedFirstTrainLegs = firstTrainLegs
            .filter(
                (candidate) =>
                    candidate.arrival + minimumTransferMinutes <=
                        onwardTrainLeg.departure &&
                    candidate.departure - (route.origin.walkMinutes ?? 0) >=
                        currentMinutes
            )
            // 4. Exclude a false transfer onto the same service.
            .filter(
                (candidate) => candidate.serviceId !== onwardTrainLeg.serviceId
            )
            .sort((first, second) => second.departure - first.departure);
        const firstTrainLeg = orderedFirstTrainLegs.at(0);

        return firstTrainLeg
            ? [
                  {
                      route,
                      trainLegs: [
                          {
                              ...firstTrainLeg,
                              alternativeTrainLegs:
                                  orderedFirstTrainLegs.slice(1),
                          },
                          onwardTrainLeg,
                      ],
                  },
              ]
            : [];
    });

    return combineAlternativeOnwardTrains(connectionOptions);
}

function combineAlternativeOnwardTrains(
    connectionOptions: TrainOption[]
): TrainOption[] {
    const optionsByFirstTrain = new Map<string, TrainOption[]>();

    connectionOptions.forEach((option) => {
        const firstTrain = option.trainLegs[0]!;
        const key = `${firstTrain.serviceId}:${firstTrain.departure}`;
        const options = optionsByFirstTrain.get(key) ?? [];
        options.push(option);
        optionsByFirstTrain.set(key, options);
    });

    return Array.from(optionsByFirstTrain.values(), (options) => {
        const orderedOptions = [...options].sort(
            (first, second) =>
                first.trainLegs.at(-1)!.arrival -
                second.trainLegs.at(-1)!.arrival
        );
        const mainOption = orderedOptions[0]!;
        const alternativeOptions = orderedOptions.slice(1);
        const onwardTrainLeg = mainOption.trainLegs.at(-1)!;

        return {
            ...mainOption,
            trainLegs: [
                mainOption.trainLegs[0]!,
                {
                    ...onwardTrainLeg,
                    alternativeTrainLegs: alternativeOptions.map((option) =>
                        option.trainLegs.at(-1)!
                    ),
                },
            ],
        };
    });
}
