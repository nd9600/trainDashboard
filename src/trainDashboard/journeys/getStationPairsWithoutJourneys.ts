import type {Journey} from "../dto/journey.dto";
import type {ResolvedStationPair} from "./getCurrentJourneyPriorities";

export function getStationPairsWithoutJourneys(
    pairs: ResolvedStationPair[],
    journeys: Journey[]
): ResolvedStationPair[] {
    const journeyRoutes = new Set(
        journeys.map((journey) => `${journey.origin}-${journey.destination}`)
    );

    return pairs.filter(
        (pair) =>
            !journeyRoutes.has(`${pair.origin.crs}-${pair.destination.crs}`)
    );
}
