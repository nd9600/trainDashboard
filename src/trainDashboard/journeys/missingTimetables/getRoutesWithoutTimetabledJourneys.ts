import type {TimetabledJourney} from "../../dto/timetabledJourney.dto";
import type {JourneyRoute} from "../planning/journeyRoutes";

export function getRoutesWithoutTimetabledJourneys(
    routes: JourneyRoute[],
    timetabledJourneys: TimetabledJourney[]
): JourneyRoute[] {
    const timetabledRoutes = new Set(
        timetabledJourneys.map(
            (journey) => `${journey.origin}-${journey.destination}`
        )
    );

    const missingRouteKeys = new Set<string>();
    const missingRoutes: JourneyRoute[] = [];

    for (const route of routes) {
        const routeKey = `${route.origin.crs}-${route.destination.crs}`;

        if (timetabledRoutes.has(routeKey) || missingRouteKeys.has(routeKey)) {
            continue;
        }

        missingRouteKeys.add(routeKey);
        missingRoutes.push(route);
    }

    return missingRoutes;
}
