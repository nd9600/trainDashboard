import type {Day, DisplaySchedule} from "../dto/displaySchedule.dto";
import {timeToMinutes} from "@/utilities/time.utility";

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
    currentClock: CurrentClock
): JourneyPrediction {
    const activeSchedule = schedules.find(
        (schedule) =>
            schedule.days.includes(currentClock.day) &&
            currentClock.minutes >= timeToMinutes(schedule.startsAt) &&
            currentClock.minutes < timeToMinutes(schedule.endsAt)
    );
    return {
        activeSchedule,
        predictedJourneyId: activeSchedule?.journeyId,
    };
}
