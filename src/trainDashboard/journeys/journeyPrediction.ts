import type {Day, DisplaySchedule, Journey} from "../dto/dashboardConfig.dto";
import {timeToMinutes} from "../dto/dashboardConfig.dto";

export interface CurrentClock {
    day: Day;
    minutes: number;
}

export interface JourneyPrediction {
    activeSchedule: DisplaySchedule | undefined;
    predictedJourneyId: string | undefined;
}

export function getJourneyPrediction(
    schedules: DisplaySchedule[],
    journeys: Journey[],
    recentJourneyIds: string[],
    currentClock: CurrentClock
): JourneyPrediction {
    const activeSchedule = schedules.find(
        (schedule) =>
            schedule.days.includes(currentClock.day) &&
            currentClock.minutes >= timeToMinutes(schedule.startsAt) &&
            currentClock.minutes < timeToMinutes(schedule.endsAt)
    );
    const journeyIds = new Set(journeys.map((journey) => journey.id));
    const scheduledJourneyId = activeSchedule?.journeyId;
    const predictedJourneyId =
        scheduledJourneyId && journeyIds.has(scheduledJourneyId)
            ? scheduledJourneyId
            : recentJourneyIds.find((journeyId) => journeyIds.has(journeyId));

    return {activeSchedule, predictedJourneyId};
}
