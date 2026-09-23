import type {Journey, LocationReference} from "../dto/journey.dto";
import type {StationGroup} from "../dto/stationGroup.dto";

export function getLocationKey(location: LocationReference, groups: StationGroup[] = []): string {
    if (location.groupId === "") {
        return ""
    }

    const group = groups.find((group) => group.id === location.groupId);
    if (location.type === "group" || group?.stations.length === 1) {
        return `group:${location.groupId}`;
    }
    return ["station", location.groupId, location.crs]
        .filter((part) => part !== undefined)
        .join(":");
}

export function journeysAreTheSame(first: Journey, second: Journey): boolean {
    return getLocationKey(first.origin) === getLocationKey(second.origin)
        && getLocationKey(first.destination) === getLocationKey(second.destination)
        && first.viaCrs === second.viaCrs;
}

export function getNewJourneyId(
    baseId: string,
    existingJourneyIds: Iterable<string>
): string {
    const existingIds = new Set(existingJourneyIds);
    let id = baseId;
    for (let suffix = 2; existingIds.has(id); suffix++) {
        id = `${baseId}-${suffix}`
    }
    return id;
}

//todo: is this really "journey starts and ends at either a bare station or one of these groups"? think of a better name
export function hasJourneyEndpoints(journey: Journey, stationGroups: StationGroup[]): boolean {
    return [journey.origin, journey.destination].every(
        (location) =>
            (location.type === "station" && location.groupId === undefined)
            || stationGroups.some((group) => group.id === location.groupId)
    );
}
