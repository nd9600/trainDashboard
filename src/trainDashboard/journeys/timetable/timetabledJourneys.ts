import type {TimetabledJourney} from "../../dto/timetabledJourney.dto";
import {formatTime} from "@/utilities/time.utility.ts";
import type {TrainOption} from "./trainOptions";

export function addJourneySections(
    trainOptions: TrainOption[]
): TimetabledJourney[] {
    return trainOptions.map((trainOption) => {
        const {route, trainLegs, alternativeFirstTrainLegs} = trainOption;
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

        trainLegs.forEach((leg, index) => {
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
            alternativeFirstTrainLegs,
        };
    });
}

export function getCatchableJourneys(
    journeys: TimetabledJourney[],
    currentMinutes: number
): TimetabledJourney[] {
    return journeys.filter(
        (journey) => journey.segments.at(0)!.start >= currentMinutes
    );
}

export function sortJourneysByArrival(
    journeys: TimetabledJourney[]
): TimetabledJourney[] {
    // 5. Sort all journeys by final arrival time.
    return [...journeys].sort((first, second) => {
        const arrivalDifference =
            first.segments.at(-1)!.end - second.segments.at(-1)!.end;

        // 6. Prefer the later start when final arrival times are equal.
        return (
            arrivalDifference ||
            second.segments.at(0)!.start - first.segments.at(0)!.start
        );
    });
}

export function markRecommendedJourney(
    journeys: TimetabledJourney[]
): TimetabledJourney[] {
    const recommendedJourney = journeys.find(
        (journey) => journey.walkingTimesKnown
    );

    return journeys.map((journey) => ({
        ...journey,
        recommended: journey === recommendedJourney,
    }));
}
