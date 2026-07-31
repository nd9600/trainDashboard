import {
    timeToMinutes,
    type DashboardConfig,
    type Day,
    type DisplaySchedule,
    type LocationReference,
    type StationGroup,
    type Journey,
} from "../dto/dashboardConfig.dto";
import {journeyName} from "../presentation/settingsPresentation";

export interface CurrentClock {
    day: Day;
    minutes: number;
}

export interface StationEndpoint {
    crs: string;
    walkMinutes?: number;
    locationName: string;
}

export interface JourneyRoute {
    id: string;
    journeyId: string;
    contextLabel: string;
    origin: StationEndpoint;
    destination: StationEndpoint;
    viaCrs?: string;
}

export interface CurrentJourneyPriorities {
    schedule: DisplaySchedule | undefined;
    primaryRoutes: JourneyRoute[];
    secondaryRoutes: JourneyRoute[];
}

export function getCurrentJourneyPriorities(
    config: DashboardConfig,
    currentClock: CurrentClock
): CurrentJourneyPriorities {
    const schedule = config.schedules.find((candidate) =>
        scheduleMatches(candidate, currentClock)
    );

    if (!schedule) {
        return {
            schedule: undefined,
            primaryRoutes: [],
            secondaryRoutes: expandJourneyRoutes(
                config.journeys,
                config.stationGroups
            ),
        };
    }

    const journeysById = new Map(
        config.journeys.map((journey) => [journey.id, journey])
    );

    return {
        schedule,
        primaryRoutes: expandJourneyRoutes(
            schedule.primaryJourneyIds.flatMap((journeyId) => {
                const journey = journeysById.get(journeyId);
                return journey ? [journey] : [];
            }),
            config.stationGroups
        ),
        secondaryRoutes: expandJourneyRoutes(
            schedule.secondaryJourneyIds.flatMap((journeyId) => {
                const journey = journeysById.get(journeyId);
                return journey ? [journey] : [];
            }),
            config.stationGroups
        ),
    };
}

export function expandJourneyRoutes(
    journeys: Journey[],
    stationGroups: StationGroup[]
): JourneyRoute[] {
    const stationGroupsById = new Map(
        stationGroups.map((group) => [group.id, group])
    );

    return journeys.flatMap((journey) => {
        const origins = getStationEndpoints(journey.origin, stationGroupsById);
        const destinations = getStationEndpoints(
            journey.destination,
            stationGroupsById
        );

        return origins.flatMap((origin) =>
            destinations
                .filter((destination) => destination.crs !== origin.crs)
                .filter(
                    (destination) =>
                        journey.viaCrs === undefined ||
                        (origin.crs !== journey.viaCrs &&
                            destination.crs !== journey.viaCrs)
                )
                .map((destination) => ({
                    id: `${journey.id}:${origin.crs}-${destination.crs}`,
                    journeyId: journey.id,
                    contextLabel: journeyName(journey, stationGroups),
                    origin,
                    destination,
                    viaCrs: journey.viaCrs,
                }))
        );
    });
}

function scheduleMatches(
    schedule: DisplaySchedule,
    currentClock: CurrentClock
): boolean {
    return (
        schedule.days.includes(currentClock.day) &&
        currentClock.minutes >= timeToMinutes(schedule.startsAt) &&
        currentClock.minutes < timeToMinutes(schedule.endsAt)
    );
}

function getStationEndpoints(
    location: LocationReference,
    stationGroupsById: Map<string, StationGroup>
): StationEndpoint[] {
    const group = stationGroupsById.get(location.groupId);

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
