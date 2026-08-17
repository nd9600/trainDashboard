import type {
    DashboardConfig,
    DisplaySchedule,
} from "../dto/dashboardConfig.dto";
import type {TimetabledJourney} from "../dto/timetabledJourney.dto";
import {
    type CurrentClock,
    getActiveSchedule,
    getJourneysForSchedule,
} from "./planning/journeySelection";
import {getStationRoutes, type JourneyRoute} from "./planning/journeyRoutes";
import {getDepartureBoards} from "./timetable/departureBoards";
import {getTrainOptions} from "./timetable/trainOptions";
import {
    makeTimetabledJourneys,
    getCatchableJourneys,
    markRecommendedJourney,
    sortJourneysByArrival,
} from "./timetable/timetabledJourneys";

export interface DashboardJourneys {
    activeSchedule: DisplaySchedule | undefined;
    primaryRoutes: JourneyRoute[];
    secondaryRoutes: JourneyRoute[];
    primaryJourneys: TimetabledJourney[];
    secondaryJourneys: TimetabledJourney[];
}

export async function getDashboardJourneys(
    config: DashboardConfig,
    currentClock: CurrentClock,
    consumerKey: string
): Promise<DashboardJourneys> {
    const activeSchedule = getActiveSchedule(config.schedules, currentClock);

    const configuredJourneys = getJourneysForSchedule(
        config.journeys,
        activeSchedule
    );

    const concreteStationRoutes = {
        primaryRoutes: getStationRoutes(
            configuredJourneys.primaryJourneys,
            config.stationGroups
        ),
        secondaryRoutes: getStationRoutes(
            configuredJourneys.secondaryJourneys,
            config.stationGroups
        ),
    };

    if (!consumerKey) {
        return {
            activeSchedule,
            ...concreteStationRoutes,
            primaryJourneys: [],
            secondaryJourneys: [],
        };
    }

    const departureBoards = await getDepartureBoards(consumerKey, [
        ...concreteStationRoutes.primaryRoutes,
        ...concreteStationRoutes.secondaryRoutes,
    ]);

    const trainOptions = {
        primary: getTrainOptions(
            concreteStationRoutes.primaryRoutes,
            departureBoards,
            currentClock.minutes
        ),
        secondary: getTrainOptions(
            concreteStationRoutes.secondaryRoutes,
            departureBoards,
            currentClock.minutes
        ),
    };

    const timetabledJourneys = {
        primary: makeTimetabledJourneys(trainOptions.primary),
        secondary: makeTimetabledJourneys(trainOptions.secondary),
    };

    const catchableJourneys = {
        primary: getCatchableJourneys(
            timetabledJourneys.primary,
            currentClock.minutes
        ),
        secondary: getCatchableJourneys(
            timetabledJourneys.secondary,
            currentClock.minutes
        ),
    };

    const journeysSortedByArrival = {
        primary: sortJourneysByArrival(catchableJourneys.primary),
        secondary: sortJourneysByArrival(catchableJourneys.secondary),
    };

    return {
        activeSchedule,
        ...concreteStationRoutes,
        primaryJourneys: markRecommendedJourney(
            journeysSortedByArrival.primary
        ),
        secondaryJourneys: journeysSortedByArrival.secondary,
    };
}
