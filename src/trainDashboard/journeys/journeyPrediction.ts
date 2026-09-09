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
    activeSchedule: DisplaySchedule | undefined;
    predictedJourneyId: string | undefined;
    alternativeJourneyIds: string[];
    nearbyStationGroupId: string | undefined;
    reason: JourneyPredictionReason | undefined;
}

export function getJourneyPrediction(
    config: DashboardConfig,
    currentClock: CurrentClock,
    currentCoordinates: Coordinates | null
): JourneyPrediction {
    const activeSchedule = config.schedules.find((schedule) =>
        isScheduleActive(schedule, currentClock)
    );
    const nearbyGroup = getNearbyStationGroup(
        config.stationGroups,
        currentCoordinates
    );
    const prediction: JourneyPrediction = {
        activeSchedule,
        predictedJourneyId: undefined,
        alternativeJourneyIds: [],
        nearbyStationGroupId: nearbyGroup?.id,
        reason: undefined,
    };

    if (!nearbyGroup) {
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

    const journeys = config.journeys.filter((journey) =>
        startsAtGroup(journey, nearbyGroup)
    );
    const journeyIds = new Set(journeys.map((journey) => journey.id));
    const schedules = config.schedules
        .filter((schedule) => journeyIds.has(schedule.journeyId))
        .sort(
            (first, second) =>
                getMinutesUntilSchedule(first, currentClock) -
                getMinutesUntilSchedule(second, currentClock)
        );
    const schedule = schedules[0];
    const candidateIds = schedule
        ? [...new Set(schedules.map((candidate) => candidate.journeyId))]
        : journeys.map((journey) => journey.id);

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
    if (isScheduleActive(schedule, clock)) return 0;
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
