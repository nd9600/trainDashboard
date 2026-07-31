import {
    timeToMinutes,
    type DashboardConfig,
    type Day,
    type DisplaySchedule,
    type LocationReference,
    type StationGroup,
    type Journey,
} from "../dto/dashboardConfig.dto";
import {formatJourneyName} from "../presentation/settingsPresentation";

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

export interface ActiveJourneyPlan {
    schedule: DisplaySchedule | undefined;
    primaryRoutes: JourneyRoute[];
    secondaryRoutes: JourneyRoute[];
}

export function getActiveJourneyPlan(
    config: DashboardConfig,
    currentClock: CurrentClock
): ActiveJourneyPlan {
    const schedule = config.schedules.find((candidate) =>
        isScheduleActive(candidate, currentClock)
    );

    if (!schedule) {
        return {
            schedule: undefined,
            primaryRoutes: [],
            secondaryRoutes: getRoutesForJourneys(
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
        primaryRoutes: getRoutesForJourneys(
            schedule.primaryJourneyIds.flatMap((journeyId) => {
                const journey = journeysById.get(journeyId);
                return journey ? [journey] : [];
            }),
            config.stationGroups
        ),
        secondaryRoutes: getRoutesForJourneys(
            schedule.secondaryJourneyIds.flatMap((journeyId) => {
                const journey = journeysById.get(journeyId);
                return journey ? [journey] : [];
            }),
            config.stationGroups
        ),
    };
}

export function getRoutesForJourneys(
    journeys: Journey[],
    stationGroups: StationGroup[]
): JourneyRoute[] {
    const stationGroupsById = new Map(
        stationGroups.map((group) => [group.id, group])
    );

    return journeys.flatMap((journey) => {
        const origins = getStationsForLocation(
            journey.origin,
            stationGroupsById
        );
        console.log(journey, origins);
        const destinations = getStationsForLocation(
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
                    contextLabel: formatJourneyName(journey, stationGroups),
                    origin,
                    destination,
                    viaCrs: journey.viaCrs,
                }))
        );
    });
}

function isScheduleActive(
    schedule: DisplaySchedule,
    currentClock: CurrentClock
): boolean {
    return (
        schedule.days.includes(currentClock.day) &&
        currentClock.minutes >= timeToMinutes(schedule.startsAt) &&
        currentClock.minutes < timeToMinutes(schedule.endsAt)
    );
}

function getStationsForLocation(
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
