import type {
    DepartureBoard,
    DepartureService,
} from "../../dto/liveDepartureBoard.dto";
import type {TrainLeg} from "../../dto/timetabledJourney.dto";
import type {JourneyRoute} from "../planning/journeyRoutes";
import {getDepartureBoard, type DepartureBoards} from "./departureBoards";

export interface TrainOption {
    route: JourneyRoute;
    trainLegs: TrainLeg[];
}

const minimumTransferMinutes = 3;

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

function getDirectTrainLegs(
    board: DepartureBoard,
    originCrs: string,
    destinationCrs: string,
    currentMinutes: number
): TrainLeg[] {
    return board.trainServices
        .flatMap((service) => {
            const leg = getTrainLeg(
                service,
                originCrs,
                destinationCrs,
                currentMinutes
            );

            return leg ? [leg] : [];
        })
        .sort((first, second) => first.departure - second.departure);
}

function getTrainLeg(
    service: DepartureService,
    originCrs: string,
    destinationCrs: string,
    currentMinutes: number
): TrainLeg | undefined {
    if (service.isCancelled) {
        return undefined;
    }

    const destinationCallingPoint = service.subsequentCallingPoints
        .flatMap((callingPoints) => callingPoints.callingPoint)
        .find(
            (callingPoint) =>
                callingPoint.crs.toUpperCase() === destinationCrs.toUpperCase()
        );

    if (!destinationCallingPoint || destinationCallingPoint.isCancelled) {
        return undefined;
    }

    const departure = getMinutesOnOrAfter(
        getLiveOrScheduledTime(service.etd, service.std),
        currentMinutes - 60
    );

    if (departure === undefined) {
        return undefined;
    }

    const arrival = getMinutesOnOrAfter(
        getLiveOrScheduledTime(
            destinationCallingPoint.et,
            destinationCallingPoint.st
        ),
        departure
    );

    if (arrival === undefined) {
        return undefined;
    }

    return {
        serviceId: service.serviceID,
        origin: originCrs,
        destination: destinationCrs,
        platform: service.platform,
        departure,
        arrival,
    };
}

function getMinutesOnOrAfter(
    time: string,
    referenceMinutes: number
): number | undefined {
    if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) {
        return undefined;
    }

    const [hours, minutes] = time.split(":").map(Number);
    let result =
        hours! * 60 + minutes! + Math.floor(referenceMinutes / 1440) * 1440;

    while (result < referenceMinutes) {
        result += 1440;
    }

    return result;
}

function getLiveOrScheduledTime(
    liveTime: string | null | undefined,
    scheduledTime: string
): string {
    return liveTime && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(liveTime)
        ? liveTime
        : scheduledTime;
}
