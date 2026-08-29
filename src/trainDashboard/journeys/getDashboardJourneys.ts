import type {Journey, StationGroup} from "../dto/dashboardConfig.dto";
import type {TimetabledJourney} from "../dto/timetabledJourney.dto";
import type {CurrentClock} from "./journeySelection";
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
    routes: JourneyRoute[];
    journeys: TimetabledJourney[];
}

export async function getDashboardJourneys(
    journey: Journey | undefined,
    stationGroups: StationGroup[],
    currentClock: CurrentClock,
    consumerKey: string
): Promise<DashboardJourneys> {
    const routes = getStationRoutes(journey ? [journey] : [], stationGroups);

    if (!consumerKey) {
        return {routes, journeys: []};
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
        routes,
        journeys: markRecommendedJourney(journeysSortedByArrival),
    };
}
