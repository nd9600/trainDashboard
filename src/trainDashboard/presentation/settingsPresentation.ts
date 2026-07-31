import type {
    LocationReference,
    StationGroup,
    Journey,
} from "../dto/dashboardConfig.dto";
import {stationDisplayName} from "../stations/stations";

export function formatLocationReference(
    location: LocationReference,
    stationGroups: StationGroup[]
): string {
    const group = stationGroups.find(
        (candidate) => candidate.id === location.groupId
    );

    if (location.type === "station") {
        return `${group?.name ?? "Missing group"}, through ${stationDisplayName(location.crs)}`;
    }

    return group?.name ?? "Missing group";
}

export function formatJourneyName(
    journey: Journey,
    stationGroups: StationGroup[]
): string {
    const route = `${formatLocationReference(journey.origin, stationGroups)} → ${formatLocationReference(journey.destination, stationGroups)}`;

    return journey.viaCrs
        ? `${route}, changing at ${stationDisplayName(journey.viaCrs)}`
        : route;
}
