import type {TrainLeg} from "../../dto/timetabledJourney.dto";
import type {JourneyRoute} from "../planning/journeyRoutes";
import type {RouteTimetable} from "./loadRouteTimetables";
import {minimumTransferMinutes} from "./trainLegs";

export interface TrainPlan {
    route: JourneyRoute;
    trainLegs: TrainLeg[];
}

export function getTrainPlans(
    {route, firstTrainLegs, onwardTrainLegs = []}: RouteTimetable,
    currentMinutes: number
): TrainPlan[] {
    if (!route.viaCrs) return firstTrainLegs.map((leg) => ({route, trainLegs: [leg]}));

    const plans = new Map<string, TrainPlan>();
    const feeders = firstTrainLegs
        .filter((leg) => leg.departure - (route.origin.walkMinutes ?? 0) >= currentMinutes)
        .sort((first, second) => second.departure - first.departure);
    // Earliest arrival wins. Later onward trains sharing its feeder become alternatives.
    for (const onward of [...onwardTrainLegs].sort(
        (first, second) => first.arrival - second.arrival
    )) {
        const [first, ...alternatives] = feeders.filter(
            (leg) =>
                leg.arrival + minimumTransferMinutes <= onward.departure &&
                leg.serviceId !== onward.serviceId
        );
        if (!first) continue;
        const key = `${first.serviceId}:${first.departure}`;
        const existing = plans.get(key);
        if (existing) {
            existing.trainLegs[1]!.alternativeTrainLegs!.push(onward);
        } else {
            plans.set(key, {
                route,
                trainLegs: [
                    {...first, alternativeTrainLegs: alternatives},
                    {...onward, alternativeTrainLegs: []},
                ],
            });
        }
    }
    return [...plans.values()];
}
