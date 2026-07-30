import {
    timeToMinutes,
    type DashboardConfig,
    type Day,
    type DisplaySchedule,
    type LocationReference,
    type StationGroup,
    type StationPair,
} from "../dto/dashboardConfig.dto";

export interface ClockContext {
    day: Day;
    minutes: number;
}

export interface ResolvedEndpoint {
    crs: string;
    walkMinutes?: number;
    locationName: string;
}

export interface ResolvedStationPair {
    id: string;
    pairId: string;
    origin: ResolvedEndpoint;
    destination: ResolvedEndpoint;
}

export interface CurrentJourneyPriorities {
    schedule: DisplaySchedule | undefined;
    primaryPairs: ResolvedStationPair[];
    secondaryPairs: ResolvedStationPair[];
}

export function clockContextFromDate(date: Date): ClockContext {
    return {
        day: date.getDay() as Day,
        minutes: date.getHours() * 60 + date.getMinutes(),
    };
}

export function getCurrentJourneyPriorities(
    config: DashboardConfig,
    clock: ClockContext
): CurrentJourneyPriorities {
    const schedule = config.schedules.find((candidate) =>
        scheduleMatches(candidate, clock)
    );

    if (!schedule) {
        return {
            schedule: undefined,
            primaryPairs: [],
            secondaryPairs: expandStationPairs(config.pairs, config.groups),
        };
    }

    const pairsById = new Map(config.pairs.map((pair) => [pair.id, pair]));

    return {
        schedule,
        primaryPairs: expandStationPairs(
            schedule.primaryPairIds.flatMap((pairId) => {
                const pair = pairsById.get(pairId);
                return pair ? [pair] : [];
            }),
            config.groups
        ),
        secondaryPairs: expandStationPairs(
            schedule.secondaryPairIds.flatMap((pairId) => {
                const pair = pairsById.get(pairId);
                return pair ? [pair] : [];
            }),
            config.groups
        ),
    };
}

export function expandStationPairs(
    pairs: StationPair[],
    groups: StationGroup[]
): ResolvedStationPair[] {
    const groupsById = new Map(groups.map((group) => [group.id, group]));

    return pairs.flatMap((pair) => {
        const origins = resolveLocation(pair.origin, groupsById);
        const destinations = resolveLocation(pair.destination, groupsById);

        return origins.flatMap((origin) =>
            destinations
                .filter((destination) => destination.crs !== origin.crs)
                .map((destination) => ({
                    id: `${pair.id}:${origin.crs}-${destination.crs}`,
                    pairId: pair.id,
                    origin,
                    destination,
                }))
        );
    });
}

function scheduleMatches(
    schedule: DisplaySchedule,
    clock: ClockContext
): boolean {
    return (
        schedule.days.includes(clock.day) &&
        clock.minutes >= timeToMinutes(schedule.startsAt) &&
        clock.minutes < timeToMinutes(schedule.endsAt)
    );
}

function resolveLocation(
    location: LocationReference,
    groupsById: Map<string, StationGroup>
): ResolvedEndpoint[] {
    const group = groupsById.get(location.groupId);

    if (!group) {
        return [];
    }

    const stations =
        location.type === "station"
            ? group.stations.filter((station) => station.crs === location.crs)
            : group.stations;

    return stations.map((station) => ({
        crs: station.crs,
        walkMinutes: station.walkMinutes,
        locationName: group.name,
    }));
}
