import {fetchDepartureBoard} from "../../api/railDataMarketplace.api";
import type {
    DepartureBoard,
    DepartureService,
} from "../../dto/liveDepartureBoard.dto";
import type {
    TimetabledJourney,
    TrainLeg,
} from "../../dto/timetabledJourney.dto";
import type {JourneyRoute} from "../planning/journeyRoutes";
import {formatTime} from "@/utilities/time.utility.ts";

interface ServiceLeg extends TrainLeg {
    serviceId: string;
}

const minimumTransferMinutes = 3;

export type DepartureBoardRequestCache = Map<string, Promise<DepartureBoard>>;

export async function getTimetabledJourneys(
    consumerKey: string,
    journeyRoutes: JourneyRoute[],
    currentMinutes: number,
    recommendJourney: boolean,
    departureBoardRequestCache: DepartureBoardRequestCache = new Map()
): Promise<TimetabledJourney[]> {
    function fetchBoard(
        originCrs: string,
        destinationCrs: string,
        timeOffsetMinutes: number
    ) {
        const route = `${originCrs}-${destinationCrs}:${timeOffsetMinutes}`;
        const existingDepartureBoard = departureBoardRequestCache.get(route);

        if (existingDepartureBoard) {
            return existingDepartureBoard;
        }

        const departureBoard = fetchDepartureBoard(consumerKey, {
            originCrs,
            destinationCrs,
            numberOfRows: 10,
            timeOffsetMinutes,
            timeWindowMinutes: 120,
        });
        departureBoardRequestCache.set(route, departureBoard);

        return departureBoard;
    }

    const timetabledJourneys = (
        await Promise.all(
            journeyRoutes.map(async (route) => {
                if (!route.viaCrs) {
                    const board = await fetchBoard(
                        route.origin.crs,
                        route.destination.crs,
                        route.origin.walkMinutes ?? 0
                    );

                    return directLegs(
                        board,
                        route.origin.crs,
                        route.destination.crs,
                        currentMinutes
                    ).map((leg) => createJourney(route, [leg]));
                }

                const [firstTrainBoard, onwardTrainBoard] = await Promise.all([
                    fetchBoard(
                        route.origin.crs,
                        route.viaCrs,
                        route.origin.walkMinutes ?? 0
                    ),
                    fetchBoard(route.viaCrs, route.destination.crs, 0),
                ]);
                const firstTrainLegs = directLegs(
                    firstTrainBoard,
                    route.origin.crs,
                    route.viaCrs,
                    currentMinutes
                );
                const onwardTrainLegs = directLegs(
                    onwardTrainBoard,
                    route.viaCrs,
                    route.destination.crs,
                    currentMinutes
                );

                // 1. Consider every catchable onward train.
                return onwardTrainLegs.flatMap((onwardTrainLeg) => {
                    // 2. Require at least three minutes to change trains.
                    const catchableFirstTrainLegs = firstTrainLegs.filter(
                        (candidate) =>
                            candidate.arrival + minimumTransferMinutes <=
                                onwardTrainLeg.departure &&
                            candidate.departure -
                                (route.origin.walkMinutes ?? 0) >=
                                currentMinutes
                    );

                    // 3. Use the latest catchable first train.
                    const orderedFirstTrainLegs = catchableFirstTrainLegs
                        // 4. Exclude a false transfer onto the same service.
                        .filter(
                            (candidate) =>
                                candidate.serviceId !== onwardTrainLeg.serviceId
                        )
                        .sort(
                            (first, second) =>
                                second.departure - first.departure
                        );
                    const firstTrainLeg = orderedFirstTrainLegs.at(0);

                    return firstTrainLeg
                        ? [
                              createJourney(
                                  route,
                                  [firstTrainLeg, onwardTrainLeg],
                                  orderedFirstTrainLegs.slice(1)
                              ),
                          ]
                        : [];
                });
            })
        )
    )
        .flat()
        .filter((journey) => journey.segments.at(0)!.start >= currentMinutes)
        // 5. Sort all journeys by final arrival time.
        .sort(compareJourneys);

    if (!recommendJourney) {
        return timetabledJourneys;
    }

    const recommendedJourney = timetabledJourneys.find(
        (journey) => journey.walkingTimesKnown
    );

    return timetabledJourneys.map((journey) => ({
        ...journey,
        recommended: journey === recommendedJourney,
    }));
}

function compareJourneys(
    first: TimetabledJourney,
    second: TimetabledJourney
): number {
    const arrivalDifference =
        first.segments.at(-1)!.end - second.segments.at(-1)!.end;

    // 6. Prefer the later start when final arrival times are equal.
    return (
        arrivalDifference ||
        second.segments.at(0)!.start - first.segments.at(0)!.start
    );
}

function directLegs(
    board: DepartureBoard,
    originCrs: string,
    destinationCrs: string,
    currentMinutes: number
): ServiceLeg[] {
    return board.trainServices
        .flatMap((service) => {
            const leg = createServiceLeg(
                service,
                originCrs,
                destinationCrs,
                currentMinutes
            );

            return leg ? [leg] : [];
        })
        .sort((first, second) => first.departure - second.departure);
}

function createServiceLeg(
    service: DepartureService,
    originCrs: string,
    destinationCrs: string,
    currentMinutes: number
): ServiceLeg | undefined {
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

    const departure = minutesOnOrAfter(
        liveTimeOrScheduled(service.etd, service.std),
        currentMinutes - 60
    );

    if (departure === undefined) {
        return undefined;
    }

    const arrival = minutesOnOrAfter(
        liveTimeOrScheduled(
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
        departure,
        arrival,
    };
}

function createJourney(
    route: JourneyRoute,
    serviceLegs: ServiceLeg[],
    alternativeFirstTrainLegs: ServiceLeg[] = []
): TimetabledJourney {
    const firstLeg = serviceLegs.at(0)!;
    const lastLeg = serviceLegs.at(-1)!;
    const walkingTimesKnown =
        route.origin.walkMinutes !== undefined &&
        route.destination.walkMinutes !== undefined;
    const finish =
        route.destination.walkMinutes === undefined
            ? lastLeg.arrival
            : lastLeg.arrival + route.destination.walkMinutes;
    const segments: TimetabledJourney["segments"] = [];

    if (
        route.origin.walkMinutes !== undefined &&
        route.origin.walkMinutes > 0
    ) {
        segments.push({
            kind: "walk",
            start: firstLeg.departure - route.origin.walkMinutes,
            end: firstLeg.departure,
        });
    }

    serviceLegs.forEach((leg, index) => {
        const previousLeg = serviceLegs[index - 1];

        if (previousLeg && leg.departure > previousLeg.arrival) {
            segments.push({
                kind: "wait",
                start: previousLeg.arrival,
                end: leg.departure,
            });
        }

        segments.push({
            kind: "train",
            start: leg.departure,
            end: leg.arrival,
        });
    });

    if (
        route.destination.walkMinutes !== undefined &&
        route.destination.walkMinutes > 0
    ) {
        segments.push({
            kind: "walk",
            start: lastLeg.arrival,
            end: finish,
        });
    }

    return {
        id: `${route.id}:${serviceLegs.map((leg) => leg.serviceId).join(":")}`,
        journeyId: route.journeyId,
        origin: route.origin.crs,
        originLocationName: route.origin.locationName,
        destination: route.destination.crs,
        destinationLocationName: route.destination.locationName,
        railArrivalTime: formatTime(lastLeg.arrival),
        arrivalLabel:
            route.destination.walkMinutes === undefined
                ? undefined
                : route.destination.locationName,
        arrivalTime:
            route.destination.walkMinutes === undefined
                ? undefined
                : formatTime(finish),
        boldArrivalTime:
            route.destination.walkMinutes !== undefined &&
            route.destination.locationName.toLowerCase() === "home",
        walkingTimesKnown,
        segments,
        trainLegs: serviceLegs.map(
            ({origin, destination, departure, arrival}) => ({
                origin,
                destination,
                departure,
                arrival,
            })
        ),
        alternativeFirstTrainLegs: alternativeFirstTrainLegs.map(
            ({origin, destination, departure, arrival}) => ({
                origin,
                destination,
                departure,
                arrival,
            })
        ),
    };
}

function minutesOnOrAfter(
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

function liveTimeOrScheduled(
    liveTime: string | null | undefined,
    scheduledTime: string
): string {
    return liveTime && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(liveTime)
        ? liveTime
        : scheduledTime;
}
