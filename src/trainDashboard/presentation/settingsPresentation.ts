import type {
    LocationReference,
    StationGroup,
    StationPair,
} from "../dto/dashboardConfig.dto";
import {stationDisplayName} from "../stations/stations";

export function locationReferenceName(
    location: LocationReference,
    groups: StationGroup[]
): string {
    const group = groups.find((candidate) => candidate.id === location.groupId);

    if (location.type === "station") {
        return `${group?.name ?? "Missing group"}, through ${stationDisplayName(location.crs)}`;
    }

    return group?.name ?? "Missing group";
}

export function stationPairName(
    pair: StationPair,
    groups: StationGroup[]
): string {
    return `${locationReferenceName(pair.origin, groups)} → ${locationReferenceName(pair.destination, groups)}`;
}
