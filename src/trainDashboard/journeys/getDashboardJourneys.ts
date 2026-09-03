import type {Journey, StationGroup} from "../dto/dashboardConfig.dto";
import type {TimetabledJourney} from "../dto/timetabledJourney.dto";
import {getStationRoutes, type JourneyRoute} from "./planning/journeyRoutes";
import {getDepartureBoards} from "./timetable/departureBoards";
import {planTimetabledJourneys} from "./timetable/planTimetabledJourneys";

interface DashboardJourneys {
    routes: JourneyRoute[];
    journeys: TimetabledJourney[];
}

export async function getDashboardJourneys(
    journey: Journey | undefined,
    stationGroups: StationGroup[],
    currentMinutes: number,
    consumerKey: string
): Promise<DashboardJourneys> {
    const routes = getStationRoutes(journey, stationGroups);

    if (!consumerKey) {
        return {routes, journeys: []};
    }

    const departureBoards = await getDepartureBoards(
        consumerKey,
        routes,
        currentMinutes
    );
    return {
        routes,
        journeys: planTimetabledJourneys(
            routes,
            departureBoards,
            currentMinutes
        ),
    };
}
