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

export async function getTimetabledJourneys(
    consumerKey: string,
    journeyRoutes: JourneyRoute[],
    currentMinutes: number,
    recommendJourney: boolean
): Promise<TimetabledJourney[]> {
    const departureBoardRequestCache = new Map<
        string,
        Promise<DepartureBoard>
    >();

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

                const [firstBoard, secondBoard] = await Promise.all([
                    fetchBoard(
                        route.origin.crs,
                        route.viaCrs,
                        route.origin.walkMinutes ?? 0
                    ),
                    fetchBoard(route.viaCrs, route.destination.crs, 0),
                ]);
                const firstLegs = directLegs(
                    firstBoard,
                    route.origin.crs,
                    route.viaCrs,
                    currentMinutes
                );
                const secondLegs = directLegs(
                    secondBoard,
                    route.viaCrs,
                    route.destination.crs,
                    currentMinutes
                );

                return firstLegs.flatMap((firstLeg) => {
                    const secondLeg = secondLegs.find(
                        (candidate) =>
                            candidate.departure >=
                            firstLeg.arrival + minimumTransferMinutes
                    );

                    return secondLeg
                        ? [createJourney(route, [firstLeg, secondLeg])]
                        : [];
                });
            })
        )
    )
        .flat()
        .filter((journey) => journey.segments.at(0)!.start >= currentMinutes)
        .sort((first, second) => {
            const arrivalDifference =
                first.segments.at(-1)!.end - second.segments.at(-1)!.end;

            return (
                arrivalDifference ||
                first.segments.at(0)!.start - second.segments.at(0)!.start
            );
        });

    if (!recommendJourney) {
        return timetabledJourneys;
    }

    const recommendedJourney = [...timetabledJourneys]
        .filter(
            (journey) =>
                journey.walkingTimesKnown &&
                journey.segments.at(0)!.start >= currentMinutes
        )
        .sort((first, second) => {
            const arrivalDifference =
                first.segments.at(-1)!.end - second.segments.at(-1)!.end;

            if (arrivalDifference !== 0) {
                return arrivalDifference;
            }

            return first.segments.at(0)!.start - second.segments.at(0)!.start;
        })
        .at(0);

    return timetabledJourneys.map((journey) => ({
        ...journey,
        recommended: journey === recommendedJourney,
    }));
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
    serviceLegs: ServiceLeg[]
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
        origin: route.origin.crs,
        destination: route.destination.crs,
        contextLabel: route.contextLabel,
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
