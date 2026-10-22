import type {TimetabledJourney} from "../../dto/timetabledJourney.dto";
import type {JourneyRoute} from "../planning/journeyRoutes";

export function getRoutesWithoutTimetabledJourneys(
    routes: JourneyRoute[],
    timetabledJourneys: TimetabledJourney[]
): JourneyRoute[] {
    const timetabledStationPairs = new Set(
        timetabledJourneys.map((journey) => `${journey.origin}-${journey.destination}`)
    );

    const missingStationPairs = new Set<string>();
    const missingRoutes: JourneyRoute[] = [];

    for (const route of routes) {
        const routeKey = `${route.origin.crs}-${route.destination.crs}`;

        if (timetabledStationPairs.has(routeKey) || missingStationPairs.has(routeKey)) {
            continue;
        }

        missingStationPairs.add(routeKey);
        missingRoutes.push(route);
    }

    return missingRoutes;
}
