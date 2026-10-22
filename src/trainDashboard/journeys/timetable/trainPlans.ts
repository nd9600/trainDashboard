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
    if (!route.viaCrs) {
        return firstTrainLegs.map((leg) => ({route, trainLegs: [leg]}))
    }

    const plansByFirstTrain = new Map<string, TrainPlan>();
    const catchableFirstTrainLegs = firstTrainLegs
        .filter((leg) => leg.departure - (route.origin.walkMinutes ?? 0) >= currentMinutes)
        .sort((first, second) => second.departure - first.departure);
    // Choose the onward train that arrives first.
    const onwardTrainLegsByArrival = [...onwardTrainLegs].sort(
        (first, second) => first.arrival - second.arrival
    );

    for (const onwardTrainLeg of onwardTrainLegsByArrival) {
        const [firstTrainLeg, ...alternativeFirstTrainLegs] = catchableFirstTrainLegs.filter(
            (leg) =>
                leg.arrival + minimumTransferMinutes <= onwardTrainLeg.departure &&
                leg.serviceId !== onwardTrainLeg.serviceId
        );
        if (!firstTrainLeg) {
            continue;
        }
        const firstTrainKey = `${firstTrainLeg.serviceId}:${firstTrainLeg.departure}`;
        const existingPlan = plansByFirstTrain.get(firstTrainKey);
        if (existingPlan) {
            // Keep later arrivals as alternatives when they use the same first train.
            existingPlan.trainLegs[1]!.alternativeTrainLegs!.push(onwardTrainLeg);
        } else {
            plansByFirstTrain.set(firstTrainKey, {
                route,
                trainLegs: [
                    {...firstTrainLeg, alternativeTrainLegs: alternativeFirstTrainLegs},
                    {...onwardTrainLeg, alternativeTrainLegs: []},
                ],
            });
        }
    }
    return [...plansByFirstTrain.values()];
}
