import type {Journey} from "../dto/journey.dto";
import type {StationGroup} from "../dto/stationGroup.dto";
import type {TimetabledJourney} from "../dto/timetabledJourney.dto";
import {getStationRoutes, type JourneyRoute} from "./planning/journeyRoutes";
import {loadRouteTimetables} from "./timetable/loadRouteTimetables";
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

    const routeTimetables = await loadRouteTimetables(
        consumerKey,
        routes,
        currentMinutes
    );
    return {
        routes,
        journeys: planTimetabledJourneys(routeTimetables, currentMinutes),
    };
}
