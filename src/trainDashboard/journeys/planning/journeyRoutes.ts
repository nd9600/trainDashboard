import type {
    Journey,
    LocationReference,
    StationGroup,
} from "../../dto/dashboardConfig.dto";
import {stationName} from "../../stations/stations";

export interface StationEndpoint {
    crs: string;
    walkMinutes?: number;
    locationName: string;
}

export interface JourneyRoute {
    id: string;
    journeyId: string;
    origin: StationEndpoint;
    destination: StationEndpoint;
    viaCrs?: string;
}

export function getStationRoutes(
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
        const destinations = getStationsForLocation(
            journey.destination,
            stationGroupsById
        );

        return origins.flatMap((origin) =>
            destinations
                .filter((destination) => destination.crs !== origin.crs)
                .flatMap((destination) =>
                    getRouteOptions(journey, origin, destination)
                )
        );
    });
}

function getRouteOptions(
    journey: Journey,
    origin: StationEndpoint,
    destination: StationEndpoint
): JourneyRoute[] {
    const routeId = `${journey.id}:${origin.crs}-${destination.crs}`;
    const route = {
        journeyId: journey.id,
        origin,
        destination,
    };

    if (
        journey.viaCrs === undefined ||
        journey.viaCrs === origin.crs ||
        journey.viaCrs === destination.crs
    ) {
        return [{id: routeId, ...route}];
    }

    return [
        {id: `${routeId}:direct`, ...route},
        {
            id: `${routeId}:via-${journey.viaCrs}`,
            ...route,
            viaCrs: journey.viaCrs,
        },
    ];
}

function getStationsForLocation(
    location: LocationReference,
    stationGroupsById: Map<string, StationGroup>
): StationEndpoint[] {
    if (location.type === "station") {
        if (location.groupId === undefined) {
            return [
                {crs: location.crs, locationName: stationName(location.crs)},
            ];
        }

        const group = stationGroupsById.get(location.groupId);

        return group
            ? group.stations
                  .filter((station) => station.crs === location.crs)
                  .map((station) => ({
                      crs: station.crs,
                      walkMinutes: station.walkMinutes,
                      locationName: group.name,
                  }))
            : [];
    }

    const group = stationGroupsById.get(location.groupId);

    if (!group) {
        return [];
    }

    return group.stations.map((station) => ({
        crs: station.crs,
        walkMinutes: station.walkMinutes,
        locationName: group.name,
    }));
}
