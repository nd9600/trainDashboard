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

export function getJourneyPrediction(
    config: DashboardConfig,
    currentClock: CurrentClock,
    currentCoordinates: Coordinates | null
): JourneyPrediction {
    const nearbyGroup = getNearbyStationGroup(config.stationGroups, currentCoordinates);

    // If a station group is nearby, use journeys that start at that group.
    const journeys = nearbyGroup
        ? config.journeys.filter((journey) => journeyStartsAtGroup(journey, nearbyGroup))
        : [];
    const journeyIds = new Set(journeys.map((journey) => journey.id));

    // Without a nearby group, use only schedules that are active now.
    const schedules = config.schedules.filter((schedule) =>
        nearbyGroup ? journeyIds.has(schedule.journeyId) : isScheduleActive(schedule, currentClock)
    );

    // Put active schedules first.
    // Then put other schedules in order of their next start date and time.
    // If schedules have the same priority, use their order in settings.
    if (nearbyGroup) {
        schedules.sort(
            (first, second) =>
                getMinutesUntilSchedule(first, currentClock) -
                getMinutesUntilSchedule(second, currentClock)
        );
    }

    // Put scheduled journeys before other saved journeys. Include each journey only once.
    const [predictedJourneyId, ...alternativeJourneyIds] = new Set([
        ...schedules.map((schedule) => schedule.journeyId),
        ...journeyIds,
    ]);

    // Get the reason for this prediction.
    const schedule = schedules[0];
    let reason: JourneyPredictionReason | undefined;
    if (schedule) {
        reason = {
            type: "schedule",
            scheduleId: schedule.id,
            timing: isScheduleActive(schedule, currentClock) ? "active" : "upcoming",
        };
    } else if (nearbyGroup) {
        reason = journeys.length
            ? {type: "saved", onlyJourney: journeys.length === 1}
            : {type: "nearby"};
    }

    return {
        predictedJourneyId,
        alternativeJourneyIds,
        nearbyStationGroupId: nearbyGroup?.id,
        reason,
    };
}

function journeyStartsAtGroup(journey: Journey, group: StationGroup): boolean {
    const origin = journey.origin;
    if (origin.groupId !== undefined) {
        return origin.groupId === group.id;
    }
    return origin.type === "station"
        && group.stations.some((station) => station.crs === origin.crs)
    ;
}

function isScheduleActive(schedule: DisplaySchedule, clock: CurrentClock): boolean {
    return (
        schedule.days.includes(clock.day) &&
        clock.minutes >= timeToMinutes(schedule.startsAt) &&
        clock.minutes < timeToMinutes(schedule.endsAt)
    );
}

function getMinutesUntilSchedule(schedule: DisplaySchedule, clock: CurrentClock): number {
    if (isScheduleActive(schedule, clock)) {
        return 0;
    }

    const weekMinutes = 7 * 1440;
    return Math.min(
        ...schedule.days.map((day) => {
            const difference = (day - clock.day) * 1440 + timeToMinutes(schedule.startsAt) - clock.minutes;
            return (difference + weekMinutes) % weekMinutes;
        })
    );
}
