import type {RailDataMarketplaceApi} from "../api/railDataMarketplace.api";
import type {
    DepartureBoard,
    DepartureService,
} from "../dto/liveDepartureBoard.dto";
import type {Journey, TrainLeg} from "../dto/journey.dto";
import type {ResolvedStationPair} from "./getCurrentJourneyPriorities";
import {formatTime} from "@/utilities/time.utility.ts";

interface ServiceLeg extends TrainLeg {
    serviceId: string;
}

const minimumTransferMinutes = 3;

export async function getJourneys(
    api: RailDataMarketplaceApi,
    pairs: ResolvedStationPair[],
    now: number,
    recommendJourney: boolean
): Promise<Journey[]> {
    const boardRequests = new Map<string, Promise<DepartureBoard>>();

    function getBoard(
        originCrs: string,
        destinationCrs: string,
        timeOffsetMinutes: number
    ) {
        const route = `${originCrs}-${destinationCrs}:${timeOffsetMinutes}`;
        const existingRequest = boardRequests.get(route);

        if (existingRequest) {
            return existingRequest;
        }

        const request = api.getDepartureBoard({
            originCrs,
            destinationCrs,
            numberOfRows: 10,
            timeOffsetMinutes,
            timeWindowMinutes: 120,
        });
        boardRequests.set(route, request);

        return request;
    }

    const journeys = (
        await Promise.all(
            pairs.map(async (pair) => {
                if (!pair.viaCrs) {
                    const board = await getBoard(
                        pair.origin.crs,
                        pair.destination.crs,
                        pair.origin.walkMinutes ?? 0
                    );

                    return directLegs(
                        board,
                        pair.origin.crs,
                        pair.destination.crs,
                        now
                    ).map((leg) => createJourney(pair, [leg]));
                }

                const [firstBoard, secondBoard] = await Promise.all([
                    getBoard(
                        pair.origin.crs,
                        pair.viaCrs,
                        pair.origin.walkMinutes ?? 0
                    ),
                    getBoard(pair.viaCrs, pair.destination.crs, 0),
                ]);
                const firstLegs = directLegs(
                    firstBoard,
                    pair.origin.crs,
                    pair.viaCrs,
                    now
                );
                const secondLegs = directLegs(
                    secondBoard,
                    pair.viaCrs,
                    pair.destination.crs,
                    now
                );

                return firstLegs.flatMap((firstLeg) => {
                    const secondLeg = secondLegs.find(
                        (candidate) =>
                            candidate.departure >=
                            firstLeg.arrival + minimumTransferMinutes
                    );

                    return secondLeg
                        ? [createJourney(pair, [firstLeg, secondLeg])]
                        : [];
                });
            })
        )
    )
        .flat()
        .filter((journey) => journey.segments.at(0)!.start >= now)
        .sort((first, second) => {
            const arrivalDifference =
                first.segments.at(-1)!.end - second.segments.at(-1)!.end;

            return (
                arrivalDifference ||
                first.segments.at(0)!.start - second.segments.at(0)!.start
            );
        });

    if (!recommendJourney) {
        return journeys;
    }

    const recommendedJourney = [...journeys]
        .filter(
            (journey) =>
                journey.walkingTimesKnown &&
                journey.segments.at(0)!.start >= now
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

    return journeys.map((journey) => ({
        ...journey,
        recommended: journey === recommendedJourney,
    }));
}

function directLegs(
    board: DepartureBoard,
    originCrs: string,
    destinationCrs: string,
    now: number
): ServiceLeg[] {
    return board.trainServices
        .flatMap((service) => {
            const leg = createServiceLeg(
                service,
                originCrs,
                destinationCrs,
                now
            );

            return leg ? [leg] : [];
        })
        .sort((first, second) => first.departure - second.departure);
}

function createServiceLeg(
    service: DepartureService,
    originCrs: string,
    destinationCrs: string,
    now: number
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
        now - 60
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
    pair: ResolvedStationPair,
    serviceLegs: ServiceLeg[]
): Journey {
    const firstLeg = serviceLegs.at(0)!;
    const lastLeg = serviceLegs.at(-1)!;
    const walkingTimesKnown =
        pair.origin.walkMinutes !== undefined &&
        pair.destination.walkMinutes !== undefined;
    const finish =
        pair.destination.walkMinutes === undefined
            ? lastLeg.arrival
            : lastLeg.arrival + pair.destination.walkMinutes;
    const segments: Journey["segments"] = [];

    if (pair.origin.walkMinutes !== undefined && pair.origin.walkMinutes > 0) {
        segments.push({
            kind: "walk",
            start: firstLeg.departure - pair.origin.walkMinutes,
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
        pair.destination.walkMinutes !== undefined &&
        pair.destination.walkMinutes > 0
    ) {
        segments.push({
            kind: "walk",
            start: lastLeg.arrival,
            end: finish,
        });
    }

    return {
        id: `${pair.id}:${serviceLegs.map((leg) => leg.serviceId).join(":")}`,
        origin: pair.origin.crs,
        destination: pair.destination.crs,
        contextLabel: pair.contextLabel,
        railArrivalTime: formatTime(lastLeg.arrival),
        arrivalLabel:
            pair.destination.walkMinutes === undefined
                ? undefined
                : pair.destination.locationName,
        arrivalTime:
            pair.destination.walkMinutes === undefined
                ? undefined
                : formatTime(finish),
        boldArrivalTime:
            pair.destination.walkMinutes !== undefined &&
            pair.destination.locationName.toLowerCase() === "home",
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
