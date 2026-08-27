import type {
    Day,
    DisplaySchedule,
    Journey,
} from "../../dto/dashboardConfig.dto";
import type {JourneyHistoryEntry} from "../../dto/journeyHistory.dto";
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

export function getRecentJourneys(
    journeys: Journey[],
    recentJourneyHistory: JourneyHistoryEntry[]
): Journey[] {
    const journeysById = new Map(
        journeys.map((journey) => [journey.id, journey])
    );
    const seenJourneyIds = new Set<string>();

    return recentJourneyHistory.flatMap(({journeyId}) => {
        const journey = journeysById.get(journeyId);

        if (!journey || seenJourneyIds.has(journeyId)) {
            return [];
        }

        seenJourneyIds.add(journeyId);
        return [journey];
    });
}

export function getPredictedJourney(
    journeys: Journey[],
    activeSchedule: DisplaySchedule | undefined,
    recentJourneyHistory: JourneyHistoryEntry[]
): Journey | undefined {
    return (
        getJourneyForSchedule(journeys, activeSchedule) ??
        getRecentJourneys(journeys, recentJourneyHistory)[0]
    );
}

export function getActiveJourney(
    journeys: Journey[],
    predictedJourney: Journey | undefined,
    temporaryJourneyId: string | undefined
): Journey | undefined {
    return (
        journeys.find((journey) => journey.id === temporaryJourneyId) ??
        predictedJourney
    );
}
