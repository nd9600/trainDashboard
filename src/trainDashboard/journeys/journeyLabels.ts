import type {
    Journey,
    LocationReference,
    StationGroup,
} from "../dto/dashboardConfig.dto";
import type {TimetabledJourney} from "../dto/timetabledJourney.dto";
import type {JourneyRoute} from "./planning/journeyRoutes";
import {stationName} from "../stations/stations";

export type JourneyLabelEndpoint =
    | {type: "location"; name: string; stationCrs?: string}
    | {type: "station"; stationCrs: string};

export interface JourneyLabelDetails {
    origin: JourneyLabelEndpoint;
    destination: JourneyLabelEndpoint;
    connectingStationCrs?: string;
}

export function getJourneyLabelDetails(
    journey: Journey,
    stationGroups: StationGroup[]
): JourneyLabelDetails {
    const stationGroupsById = new Map(
        stationGroups.map((group) => [group.id, group])
    );

    return {
        origin: getEndpointDetails(journey.origin, stationGroupsById),
        destination: getEndpointDetails(journey.destination, stationGroupsById),
        connectingStationCrs: journey.viaCrs,
    };
}

export function getRouteLabelDetails(route: JourneyRoute): JourneyLabelDetails {
    return {
        origin: {type: "location", name: route.origin.locationName},
        destination: {type: "location", name: route.destination.locationName},
        connectingStationCrs: route.viaCrs,
    };
}

export function getStationRouteLabelDetails(
    route: JourneyRoute
): JourneyLabelDetails {
    return {
        origin: {type: "station", stationCrs: route.origin.crs},
        destination: {type: "station", stationCrs: route.destination.crs},
        connectingStationCrs: route.viaCrs,
    };
}

export function getTimetabledJourneyLabelDetails(
    journey: TimetabledJourney
): JourneyLabelDetails {
    return {
        origin: {type: "location", name: journey.originLocationName},
        destination: {
            type: "location",
            name: journey.destinationLocationName,
        },
        connectingStationCrs:
            journey.trainLegs.length > 1
                ? journey.trainLegs.at(0)?.destination
                : undefined,
    };
}

export function getJourneyLabelText(details: JourneyLabelDetails): string {
    const origin = getEndpointText(details.origin, "origin");
    const destination = getEndpointText(details.destination, "destination");
    const connection = details.connectingStationCrs
        ? `, possibly connecting through ${stationName(details.connectingStationCrs)}`
        : "";

    return `${origin} → ${destination}${connection}`;
}

function getEndpointDetails(
    location: LocationReference,
    stationGroupsById: Map<string, StationGroup>
): JourneyLabelEndpoint {
    const group = stationGroupsById.get(location.groupId)!;

    return {
        type: "location",
        name: group.name,
        stationCrs:
            location.type === "station" && group.stations.length > 1
                ? location.crs
                : undefined,
    };
}

function getEndpointText(
    endpoint: JourneyLabelEndpoint,
    position: "origin" | "destination"
): string {
    if (endpoint.type === "station") {
        return stationName(endpoint.stationCrs);
    }

    if (!endpoint.stationCrs) {
        return endpoint.name;
    }

    const station = stationName(endpoint.stationCrs);

    return position === "origin"
        ? `${endpoint.name}, from ${station}`
        : `${endpoint.name}, arriving at ${station}`;
}
