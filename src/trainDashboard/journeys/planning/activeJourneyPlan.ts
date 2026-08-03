import {
    timeToMinutes,
    type DashboardConfig,
    type Day,
    type DisplaySchedule,
} from "../../dto/dashboardConfig.dto";
import {getRoutesForJourneys, type JourneyRoute} from "./journeyRoutes";

export interface CurrentClock {
    day: Day;
    minutes: number;
}

export interface ActiveJourneyPlan {
    schedule: DisplaySchedule | undefined;
    primaryRoutes: JourneyRoute[];
    secondaryRoutes: JourneyRoute[];
}

export function getActiveJourneyPlan(
    config: DashboardConfig,
    currentClock: CurrentClock
): ActiveJourneyPlan {
    const schedule = config.schedules.find((candidate) =>
        isScheduleActive(candidate, currentClock)
    );

    if (!schedule) {
        return {
            schedule: undefined,
            primaryRoutes: [],
            secondaryRoutes: getRoutesForJourneys(
                config.journeys,
                config.stationGroups
            ),
        };
    }

    const journeysById = new Map(
        config.journeys.map((journey) => [journey.id, journey])
    );

    return {
        schedule,
        primaryRoutes: getRoutesForJourneys(
            [journeysById.get(schedule.primaryJourneyId)].filter(
                (journey) => journey !== undefined
            ),
            config.stationGroups
        ),
        secondaryRoutes: getRoutesForJourneys(
            schedule.secondaryJourneyIds.flatMap((journeyId) => {
                const journey = journeysById.get(journeyId);
                return journey ? [journey] : [];
            }),
            config.stationGroups
        ),
    };
}

function isScheduleActive(
    schedule: DisplaySchedule,
    currentClock: CurrentClock
): boolean {
    return (
        schedule.days.includes(currentClock.day) &&
        currentClock.minutes >= timeToMinutes(schedule.startsAt) &&
        currentClock.minutes < timeToMinutes(schedule.endsAt)
    );
}
