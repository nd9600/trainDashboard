import type {
    DashboardConfig,
    DisplaySchedule,
} from "../dto/dashboardConfig.dto";
import type {TimetabledJourney} from "../dto/timetabledJourney.dto";
import {
    type CurrentClock,
    getActiveSchedule,
    getJourneyForSchedule,
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
    routes: JourneyRoute[];
    journeys: TimetabledJourney[];
}

export async function getDashboardJourneys(
    config: DashboardConfig,
    currentClock: CurrentClock,
    consumerKey: string
): Promise<DashboardJourneys> {
    const activeSchedule = getActiveSchedule(config.schedules, currentClock);

    const configuredJourney = getJourneyForSchedule(
        config.journeys,
        activeSchedule
    );

    const routes = getStationRoutes(
        configuredJourney ? [configuredJourney] : [],
        config.stationGroups
    );

    if (!consumerKey) {
        return {
            activeSchedule,
            routes,
            journeys: [],
        };
    }

    const departureBoards = await getDepartureBoards(consumerKey, routes);
    const trainOptions = getTrainOptions(
        routes,
        departureBoards,
        currentClock.minutes
    );
    const timetabledJourneys = makeTimetabledJourneys(trainOptions);
    const catchableJourneys = getCatchableJourneys(
        timetabledJourneys,
        currentClock.minutes
    );
    const journeysSortedByArrival = sortJourneysByArrival(catchableJourneys);

    return {
        activeSchedule,
        routes,
        journeys: markRecommendedJourney(journeysSortedByArrival),
    };
}
