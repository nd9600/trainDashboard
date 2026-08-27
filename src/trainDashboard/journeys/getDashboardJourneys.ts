import type {
    DashboardConfig,
    DisplaySchedule,
} from "../dto/dashboardConfig.dto";
import type {TimetabledJourney} from "../dto/timetabledJourney.dto";
import {
    type CurrentClock,
    getActiveJourney,
    getActiveSchedule,
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
    activeJourneyId: string | undefined;
    routes: JourneyRoute[];
    journeys: TimetabledJourney[];
}

export async function getDashboardJourneys(
    config: DashboardConfig,
    currentClock: CurrentClock,
    consumerKey: string,
    temporaryJourneyId?: string
): Promise<DashboardJourneys> {
    const activeSchedule = getActiveSchedule(config.schedules, currentClock);
    const activeJourney = getActiveJourney(
        config.journeys,
        activeSchedule,
        temporaryJourneyId
    );

    const routes = getStationRoutes(
        activeJourney ? [activeJourney] : [],
        config.stationGroups
    );

    if (!consumerKey) {
        return {
            activeSchedule,
            activeJourneyId: activeJourney?.id,
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
        activeJourneyId: activeJourney?.id,
        routes,
        journeys: markRecommendedJourney(journeysSortedByArrival),
    };
}
