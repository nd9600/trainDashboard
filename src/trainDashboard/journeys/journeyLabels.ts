import type {
    Journey,
    LocationReference,
    StationGroup,
} from "../dto/dashboardConfig.dto";
import {stationDisplayName} from "../stations/stations";

export function getLocationLabel(
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

export function getJourneyLabel(
    journey: Journey,
    stationGroups: StationGroup[]
): string {
    const route = `${getLocationLabel(journey.origin, stationGroups)} → ${getLocationLabel(journey.destination, stationGroups)}`;

    return journey.viaCrs
        ? `${route}, changing at ${stationDisplayName(journey.viaCrs)}`
        : route;
}
