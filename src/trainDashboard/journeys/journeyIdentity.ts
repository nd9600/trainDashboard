import type {Journey, LocationReference} from "../dto/journey.dto";
import type {StationGroup} from "../dto/stationGroup.dto";

export function getLocationKey(location: LocationReference, groups: StationGroup[] = []): string {
    if (location.groupId === "") return "";
    const group = groups.find((group) => group.id === location.groupId);
    if (location.type === "group" || group?.stations.length === 1) {
        return `group:${location.groupId}`;
    }
    return ["station", location.groupId, location.crs]
        .filter((part) => part !== undefined)
        .join(":");
}

export function hasSameJourneyFields(first: Journey, second: Journey): boolean {
    return (
        getLocationKey(first.origin) === getLocationKey(second.origin) &&
        getLocationKey(first.destination) === getLocationKey(second.destination) &&
        first.viaCrs === second.viaCrs
    );
}

export function getAvailableJourneyId(
    baseId: string,
    existingJourneyIds: Iterable<string>
): string {
    const existingIds = new Set(existingJourneyIds);
    let id = baseId;
    for (let suffix = 2; existingIds.has(id); suffix++) id = `${baseId}-${suffix}`;
    return id;
}
