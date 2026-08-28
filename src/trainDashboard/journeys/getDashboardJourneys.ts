import type {
    DashboardConfig,
    DisplaySchedule,
} from "../dto/dashboardConfig.dto";
import type {TimetabledJourney} from "../dto/timetabledJourney.dto";
import type {JourneyHistoryEntry} from "../dto/journeyHistory.dto";
import type {JourneySelection} from "../dto/journeySelection.dto";
import {
    type CurrentClock,
    getActiveJourney,
    getActiveSchedule,
    getPredictedJourney,
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

export interface DashboardJourneySelection {
    temporaryJourney?: JourneySelection;
    recentJourneyHistory?: JourneyHistoryEntry[];
}

export async function getDashboardJourneys(
    config: DashboardConfig,
    currentClock: CurrentClock,
    consumerKey: string,
    selection: DashboardJourneySelection = {}
): Promise<DashboardJourneys> {
    const activeSchedule = getActiveSchedule(config.schedules, currentClock);
    const predictedJourney = getPredictedJourney(
        config.journeys,
        activeSchedule,
        selection.recentJourneyHistory ?? []
    );
    const activeJourney = getActiveJourney(
        predictedJourney,
        selection.temporaryJourney
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
