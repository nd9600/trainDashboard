import {formatTime} from "@/utilities/time.utility.ts";
import type {
    TimetabledJourney,
    TrainLeg,
} from "../../dto/timetabledJourney.dto";
import type {TrainPlan} from "./trainPlans";

export function makeTimetabledJourney(trainPlan: TrainPlan): TimetabledJourney {
    const {route, trainLegs} = trainPlan;
    const firstLeg = trainLegs.at(0)!;
    const lastLeg = trainLegs.at(-1)!;
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

    addTrainSegments(segments, trainLegs);

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
        id: `${route.id}:${trainLegs.map((leg) => leg.serviceId).join(":")}`,
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
        trainLegs,
    };
}

function addTrainSegments(
    segments: TimetabledJourney["segments"],
    trainLegs: TrainLeg[]
): void {
    for (const [index, leg] of trainLegs.entries()) {
        const previousLeg = trainLegs[index - 1];

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
    }
}
