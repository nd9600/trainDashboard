import type {
    Day,
    DisplaySchedule,
    Journey,
} from "../../dto/dashboardConfig.dto";
import type {JourneyHistoryEntry} from "../../dto/journeyHistory.dto";
import type {JourneySelection} from "../../dto/journeySelection.dto";
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
): JourneySelection[] {
    const journeysById = new Map(
        journeys.map((journey) => [journey.id, journey])
    );
    const seenJourneyIds = new Set<string>();

    return recentJourneyHistory.flatMap((entry) => {
        const journey =
            entry.type === "ephemeral"
                ? entry.journey
                : journeysById.get(entry.journeyId);

        if (!journey || seenJourneyIds.has(journey.id)) {
            return [];
        }

        seenJourneyIds.add(journey.id);
        return [journey];
    });
}

export function getPredictedJourney(
    journeys: Journey[],
    activeSchedule: DisplaySchedule | undefined,
    recentJourneyHistory: JourneyHistoryEntry[]
): JourneySelection | undefined {
    return (
        getJourneyForSchedule(journeys, activeSchedule) ??
        getRecentJourneys(journeys, recentJourneyHistory)[0]
    );
}

export function getActiveJourney(
    predictedJourney: JourneySelection | undefined,
    temporaryJourney: JourneySelection | undefined
): JourneySelection | undefined {
    return temporaryJourney ?? predictedJourney;
}
