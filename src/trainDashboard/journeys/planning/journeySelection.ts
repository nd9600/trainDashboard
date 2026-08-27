import type {
    Day,
    DisplaySchedule,
    Journey,
} from "../../dto/dashboardConfig.dto";
import {timeToMinutes} from "../../dto/dashboardConfig.dto";

export interface CurrentClock {
    day: Day;
    minutes: number;
}

export function getActiveSchedule(
    schedules: DisplaySchedule[],
    currentClock: CurrentClock
): DisplaySchedule | undefined {
    return schedules.find(
        (schedule) =>
            schedule.days.includes(currentClock.day) &&
            currentClock.minutes >= timeToMinutes(schedule.startsAt) &&
            currentClock.minutes < timeToMinutes(schedule.endsAt)
    );
}

export function getJourneyForSchedule(
    journeys: Journey[],
    activeSchedule: DisplaySchedule | undefined
): Journey | undefined {
    if (!activeSchedule) {
        return undefined;
    }

    return journeys.find((journey) => journey.id === activeSchedule.journeyId);
}

export function getActiveJourney(
    journeys: Journey[],
    activeSchedule: DisplaySchedule | undefined,
    temporaryJourneyId: string | undefined
): Journey | undefined {
    return (
        journeys.find((journey) => journey.id === temporaryJourneyId) ??
        getJourneyForSchedule(journeys, activeSchedule)
    );
}
