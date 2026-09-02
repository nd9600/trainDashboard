import type {Journey, StationGroup} from "../dto/dashboardConfig.dto";
import type {TimetabledJourney} from "../dto/timetabledJourney.dto";
import type {CurrentClock} from "./journeyPrediction";
import {getStationRoutes, type JourneyRoute} from "./planning/journeyRoutes";
import {getDepartureBoards} from "./timetable/departureBoards";
import {planTimetabledJourneys} from "./timetable/planTimetabledJourneys";

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

    const departureBoards = await getDepartureBoards(
        consumerKey,
        routes,
        currentClock.minutes
    );
    return {
        routes,
        journeys: planTimetabledJourneys(
            routes,
            departureBoards,
            currentClock.minutes
        ),
    };
}
