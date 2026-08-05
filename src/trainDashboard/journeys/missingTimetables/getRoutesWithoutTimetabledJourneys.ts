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

    return routes.filter((route) => {
        const routeKey = `${route.origin.crs}-${route.destination.crs}`;

        if (timetabledRoutes.has(routeKey) || missingRouteKeys.has(routeKey)) {
            return false;
        }

        missingRouteKeys.add(routeKey);
        return true;
    });
}
