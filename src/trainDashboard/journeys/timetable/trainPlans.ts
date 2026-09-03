import type {TrainLeg} from "../../dto/timetabledJourney.dto";
import type {JourneyRoute} from "../planning/journeyRoutes";
import type {RouteTimetable} from "./loadRouteTimetables";
import {minimumTransferMinutes} from "./trainLegs";

export interface TrainPlan {
    route: JourneyRoute;
    trainLegs: TrainLeg[];
}

export function getTrainPlans(
    routeTimetable: RouteTimetable,
    currentMinutes: number
): TrainPlan[] {
    const {route, firstTrainLegs} = routeTimetable;

    if (!route.viaCrs) {
        return firstTrainLegs.map((trainLeg) => ({
            route,
            trainLegs: [trainLeg],
        }));
    }

    return getConnectionPlans(routeTimetable, currentMinutes);
}

function getConnectionPlans(
    routeTimetable: RouteTimetable,
    currentMinutes: number
): TrainPlan[] {
    const {route, firstTrainLegs, onwardTrainLegs = []} = routeTimetable;
    const connectionPlans: TrainPlan[] = [];

    for (const onwardTrainLeg of onwardTrainLegs) {
        const connectionPlan = getConnectionPlan(
            route,
            firstTrainLegs,
            onwardTrainLeg,
            currentMinutes
        );

        if (connectionPlan) {
            connectionPlans.push(connectionPlan);
        }
    }

    return groupConnectionsByFirstTrain(connectionPlans);
}

function getConnectionPlan(
    route: JourneyRoute,
    firstTrainLegs: TrainLeg[],
    onwardTrainLeg: TrainLeg,
    currentMinutes: number
): TrainPlan | undefined {
    const catchableFirstTrainLegs = firstTrainLegs
        .filter(
            (firstTrainLeg) =>
                firstTrainLeg.arrival + minimumTransferMinutes <=
                    onwardTrainLeg.departure &&
                firstTrainLeg.departure - (route.origin.walkMinutes ?? 0) >=
                    currentMinutes &&
                firstTrainLeg.serviceId !== onwardTrainLeg.serviceId
        )
        .sort((first, second) => second.departure - first.departure);
    const firstTrainLeg = catchableFirstTrainLegs.at(0);

    if (!firstTrainLeg) {
        return undefined;
    }

    return {
        route,
        trainLegs: [
            {
                ...firstTrainLeg,
                alternativeTrainLegs: catchableFirstTrainLegs.slice(1),
            },
            onwardTrainLeg,
        ],
    };
}

function groupConnectionsByFirstTrain(
    connectionPlans: TrainPlan[]
): TrainPlan[] {
    const plansByFirstTrain = new Map<string, TrainPlan[]>();

    for (const plan of connectionPlans) {
        const firstTrain = plan.trainLegs[0]!;
        const key = `${firstTrain.serviceId}:${firstTrain.departure}`;
        const plans = plansByFirstTrain.get(key) ?? [];
        plans.push(plan);
        plansByFirstTrain.set(key, plans);
    }

    return Array.from(plansByFirstTrain.values(), makeGroupedConnectionPlan);
}

function makeGroupedConnectionPlan(plans: TrainPlan[]): TrainPlan {
    const orderedPlans = [...plans].sort(
        (first, second) =>
            first.trainLegs.at(-1)!.arrival - second.trainLegs.at(-1)!.arrival
    );
    const mainPlan = orderedPlans[0]!;
    const onwardTrainLeg = mainPlan.trainLegs.at(-1)!;

    return {
        ...mainPlan,
        trainLegs: [
            mainPlan.trainLegs[0]!,
            {
                ...onwardTrainLeg,
                alternativeTrainLegs: orderedPlans
                    .slice(1)
                    .map((plan) => plan.trainLegs.at(-1)!),
            },
        ],
    };
}
