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
    | {type: "schedule"; scheduleId: string; timing: "active" | "upcoming"}
    | {type: "saved"; onlyJourney: boolean}
    | {type: "nearby"};

export interface JourneyPrediction {
    predictedJourneyId: string | undefined;
    alternativeJourneyIds: string[];
    nearbyStationGroupId: string | undefined;
    reason: JourneyPredictionReason | undefined;
}

/**
 * Returns the predicted journey (there might not be one):
 *     - If there is a station group within 2km of the current location, we only look at journeys that start at that station group:
 *         - if there's an active journey that starts at the station group, its first ranked journey
 *         - if no active schedule, its soonest schedule's first ranked journey
 *     - If there isn't a nearby station group:
 *         - and at least 1 active schedule, it's the active schedule's first ranked journey
 *         - and no active schedule, it's nothing
 * All other currently-valid journeys are returned as alternative journeys.
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
        // Without a nearby origin, only active schedules supply candidates.
        // Configuration order expresses preference when schedules overlap.
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

    // Location takes precedence over schedules for other origins. A journey can
    // match by its explicit origin group or by a station-only origin in this group.
    const journeys = config.journeys.filter((journey) =>
        startsAtGroup(journey, nearbyGroup)
    );
    const journeyIds = new Set(journeys.map((journey) => journey.id));
    // Active schedules rank first, then the next start across the weekly schedule.
    // Equal ranks retain configuration order, including overlapping active schedules.
    const schedules = config.schedules
        .filter((schedule) => journeyIds.has(schedule.journeyId))
        .sort(
            (first, second) =>
                getMinutesUntilSchedule(first, currentClock) - getMinutesUntilSchedule(second, currentClock)
        );
    const schedule = schedules[0];
    // Keep unscheduled journeys available after scheduled choices, in saved order.
    // A journey can have several schedules, but must appear only once.
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
    } else if (journeys.length > 0) {
        prediction.reason = {type: "saved", onlyJourney: journeys.length === 1};
    } else {
        // Keep the location explanation even when no journey starts at this group.
        prediction.reason = {type: "nearby"};
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
