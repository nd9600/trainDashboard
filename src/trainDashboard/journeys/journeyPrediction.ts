import type {Day, DisplaySchedule} from "../dto/displaySchedule.dto";
import type {DashboardConfig} from "../dto/dashboardConfig.dto";
import type {Coordinates} from "../dto/coordinates.dto";
import type {Journey} from "../dto/journey.dto";
import type {StationGroup} from "../dto/stationGroup.dto";
import {timeToMinutes} from "@/utilities/time.utility";
import {getNearbyStationGroup} from "./nearbyStationGroup";

export interface CurrentClock {
    day: Day;
    minutes: number;
}

export type JourneyPredictionReason =
    | { type: "schedule"; scheduleId: string; timing: "active" | "upcoming" }
    | { type: "saved"; onlyJourney: boolean }
    | { type: "nearby" };

export interface JourneyPrediction {
    predictedJourneyId: string | undefined;
    alternativeJourneyIds: string[];
    nearbyStationGroupId: string | undefined;
    reason: JourneyPredictionReason | undefined;
}

/**
 * Returns the predicted journey (there might not be one):
 *     - If there is a station group within 2km of the current location, we only look at journeys that start at that station group:
 *         - if there's an active schedule for one of those journeys, it's the journey from the highest-priority active schedule
 *         - if there isn't an active schedule, it's the journey from the soonest upcoming schedule
 *         - if none of those journeys have a schedule, it's the first saved journey
 *     - If there isn't a nearby station group:
 *         - if there's at least 1 active schedule, it's the journey from the highest-priority active schedule
 *         - if there isn't an active schedule, it's nothing
 * All other candidate journeys are returned as alternative journeys.
 */
export function getJourneyPrediction(
    config: DashboardConfig,
    currentClock: CurrentClock,
    currentCoordinates: Coordinates | null
): JourneyPrediction {
    const nearbyGroup = getNearbyStationGroup(
        config.stationGroups,
        currentCoordinates
    );
    const prediction: JourneyPrediction = {
        predictedJourneyId: undefined,
        alternativeJourneyIds: [],
        nearbyStationGroupId: nearbyGroup?.id,
        reason: undefined,
    };

    if (!nearbyGroup) {
        // if there isn't a nearby station group, we only look at active schedules
        // if several schedules are active, the predicted journey comes from highest-priority schedule
        const activeSchedules = config.schedules.filter((schedule) =>
            isScheduleActive(schedule, currentClock)
        );
        const activeSchedule = activeSchedules[0];

        prediction.alternativeJourneyIds = [
            ...new Set(activeSchedules.map((schedule) => schedule.journeyId)),
        ].slice(1);

        if (activeSchedule) {
            prediction.predictedJourneyId = activeSchedule.journeyId;
            prediction.reason = {
                type: "schedule",
                scheduleId: activeSchedule.id,
                timing: "active",
            };
        }

        return prediction;
    }

    // if there's a nearby station group, we only look at journeys that start there - it can start at the group itself,
    // or at a station within the group.
    const journeys = config.journeys.filter((journey) =>
        startsAtGroup(journey, nearbyGroup)
    );

    // if no journey starts at the nearby station group, we still return the nearby group.
    if (journeys.length === 0) {
        prediction.reason = {type: "nearby"};
        return prediction;
    }

    const journeyIds = new Set(journeys.map((journey) => journey.id));

    // active schedules come first, followed by upcoming schedules in start-time order.
    // schedules active at the same timing use their priority rankings for ordering
    const schedules = config.schedules
        .filter((schedule) => journeyIds.has(schedule.journeyId))
        .sort(
            (first, second) =>
                getMinutesUntilSchedule(first, currentClock) - getMinutesUntilSchedule(second, currentClock)
        );
    const schedule = schedules[0];

    // scheduled journeys come first, then unscheduled saved journeys
    // a journey that is in several schedules is only included once
    const candidateIds = [
        ...new Set([
            ...schedules.map((candidate) => candidate.journeyId),
            ...journeyIds,
        ]),
    ];

    prediction.predictedJourneyId = candidateIds[0];
    prediction.alternativeJourneyIds = candidateIds.slice(1);

    if (schedule) {
        prediction.reason = {
            type: "schedule",
            scheduleId: schedule.id,
            timing: isScheduleActive(schedule, currentClock)
                ? "active"
                : "upcoming",
        };
    } else {
        prediction.reason = {
            type: "saved",
            onlyJourney: journeys.length === 1,
        };
    }

    return prediction;
}

function startsAtGroup(journey: Journey, group: StationGroup): boolean {
    const origin = journey.origin;
    if (origin.groupId !== undefined) {
        return origin.groupId === group.id;
    }
    return (
        origin.type === "station" &&
        group.stations.some((station) => station.crs === origin.crs)
    );
}

function isScheduleActive(
    schedule: DisplaySchedule,
    clock: CurrentClock
): boolean {
    return (
        schedule.days.includes(clock.day) &&
        clock.minutes >= timeToMinutes(schedule.startsAt) &&
        clock.minutes < timeToMinutes(schedule.endsAt)
    );
}

function getMinutesUntilSchedule(
    schedule: DisplaySchedule,
    clock: CurrentClock
): number {
    if (isScheduleActive(schedule, clock)) {
        return 0
    }

    const weekMinutes = 7 * 1440;
    return Math.min(
        ...schedule.days.map((day) => {
            const difference =
                (day - clock.day) * 1440 +
                timeToMinutes(schedule.startsAt) -
                clock.minutes;
            return (difference + weekMinutes) % weekMinutes;
        })
    );
}
