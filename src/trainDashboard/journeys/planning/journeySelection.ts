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

export interface ConfiguredJourneys {
    primaryJourneys: Journey[];
    secondaryJourneys: Journey[];
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

export function getJourneysForSchedule(
    journeys: Journey[],
    activeSchedule: DisplaySchedule | undefined
): ConfiguredJourneys {
    if (!activeSchedule) {
        return {
            primaryJourneys: [],
            secondaryJourneys: journeys,
        };
    }

    const journeysById = new Map(
        journeys.map((journey) => [journey.id, journey])
    );
    const primaryJourney = journeysById.get(activeSchedule.primaryJourneyId);

    return {
        primaryJourneys: primaryJourney ? [primaryJourney] : [],
        secondaryJourneys: activeSchedule.secondaryJourneyIds.flatMap(
            (journeyId) => {
                const journey = journeysById.get(journeyId);
                return journey ? [journey] : [];
            }
        ),
    };
}
