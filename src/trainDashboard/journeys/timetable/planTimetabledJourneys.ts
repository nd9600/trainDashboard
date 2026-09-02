import {formatTime} from "@/utilities/time.utility.ts";
import type {
    TimetabledJourney,
    TrainLeg,
} from "../../dto/timetabledJourney.dto";
import type {JourneyRoute} from "../planning/journeyRoutes";
import {getDepartureBoard, type DepartureBoards} from "./departureBoards";
import {getDirectTrainLegs, minimumTransferMinutes} from "./trainLegs";

interface TrainPlan {
    route: JourneyRoute;
    trainLegs: TrainLeg[];
}

export function planTimetabledJourneys(
    routes: JourneyRoute[],
    departureBoards: DepartureBoards,
    currentMinutes: number
): TimetabledJourney[] {
    const journeys = routes
        .flatMap((route) =>
            getTrainPlans(route, departureBoards, currentMinutes)
        )
        .map(makeTimetabledJourney)
        .filter((journey) => journey.segments.at(0)!.start >= currentMinutes)
        .sort((first, second) => {
            const arrivalDifference =
                first.segments.at(-1)!.end - second.segments.at(-1)!.end;

            return (
                arrivalDifference ||
                second.segments.at(0)!.start - first.segments.at(0)!.start
            );
        });
    const recommendedJourney = journeys.find(
        (journey) => journey.walkingTimesKnown
    );

    return journeys.map((journey) => ({
        ...journey,
        recommended: journey === recommendedJourney,
    }));
}

function getTrainPlans(
    route: JourneyRoute,
    departureBoards: DepartureBoards,
    currentMinutes: number
): TrainPlan[] {
    if (route.viaCrs) {
        return getConnectionPlans(route, departureBoards, currentMinutes);
    }

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
    ).map((trainLeg) => ({route, trainLegs: [trainLeg]}));
}

function getConnectionPlans(
    route: JourneyRoute,
    departureBoards: DepartureBoards,
    currentMinutes: number
): TrainPlan[] {
    const viaCrs = route.viaCrs!;

    const firstTrainDepartureBoard = getDepartureBoard(
        departureBoards,
        route.origin.crs,
        viaCrs,
        route.origin.walkMinutes ?? 0
    );
    const firstTrainLegs = getDirectTrainLegs(
        firstTrainDepartureBoard,
        route.origin.crs,
        viaCrs,
        currentMinutes
    );
    
    const onwardTrainDepartureBoard = getDepartureBoard(departureBoards, viaCrs, route.destination.crs, 0);
    const onwardTrainLegs = getDirectTrainLegs(
        onwardTrainDepartureBoard,
        viaCrs,
        route.destination.crs,
        currentMinutes
    );
    const connectionPlans = onwardTrainLegs.flatMap((onwardTrainLeg) => {
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
            return [];
        }

        return [
            {
                route,
                trainLegs: [
                    {
                        ...firstTrainLeg,
                        alternativeTrainLegs: catchableFirstTrainLegs.slice(1),
                    },
                    onwardTrainLeg,
                ],
            },
        ];
    });

    return groupConnectionsByFirstTrain(connectionPlans);
}

function groupConnectionsByFirstTrain(
    connectionPlans: TrainPlan[]
): TrainPlan[] {
    const plansByFirstTrain = new Map<string, TrainPlan[]>();

    connectionPlans.forEach((plan) => {
        const firstTrain = plan.trainLegs[0]!;
        const key = `${firstTrain.serviceId}:${firstTrain.departure}`;
        const plans = plansByFirstTrain.get(key) ?? [];
        plans.push(plan);
        plansByFirstTrain.set(key, plans);
    });

    return Array.from(plansByFirstTrain.values(), (plans) => {
        const orderedPlans = [...plans].sort(
            (first, second) =>
                first.trainLegs.at(-1)!.arrival -
                second.trainLegs.at(-1)!.arrival
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
    });
}

function makeTimetabledJourney(trainPlan: TrainPlan): TimetabledJourney {
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
    };
}
