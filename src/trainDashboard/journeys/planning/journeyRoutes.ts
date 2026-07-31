import type {
    LocationReference,
    StationGroup,
    Journey,
} from "../../dto/dashboardConfig.dto";
import {formatJourneyName} from "../../presentation/settingsPresentation";

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
