import {
    distanceBetweenCoordinatesKm,
    findClosestPoint,
} from "@/utilities/location.utility";
import type {Coordinates} from "../dto/coordinates.dto";
import type {StationGroup} from "../dto/stationGroup.dto";

export const maximumNearbyDistanceMetres = 2000;

export function getNearbyStationGroup(
    stationGroups: StationGroup[],
    coordinates: Coordinates | null
): StationGroup | undefined {
    if (
        !coordinates ||
        !Number.isFinite(coordinates.latitude) ||
        !Number.isFinite(coordinates.longitude)
    ) {
        return undefined;
    }

    const points = stationGroups.flatMap((group) =>
        group.coordinates ? [{...group.coordinates, group}] : []
    );
    const closest = findClosestPoint(coordinates, points);
    if (
        !closest
        || distanceBetweenCoordinatesKm(coordinates, closest) * 1000 > maximumNearbyDistanceMetres
    ) {
        return undefined;
    }
    return closest.group;
}
