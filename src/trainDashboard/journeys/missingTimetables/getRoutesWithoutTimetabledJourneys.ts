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

    return routes.filter(
        (route) =>
            !timetabledRoutes.has(
                `${route.origin.crs}-${route.destination.crs}`
            )
    );
}
