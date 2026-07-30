import type {Journey} from "../dto/journey.dto";
import type {ResolvedStationPair} from "./getCurrentJourneyPriorities";
import {stationName} from "../stations/stations";

interface MockRoute {
    firstDepartureAfter: number;
    duration: number;
}

const mockRoutes: Readonly<Record<string, MockRoute>> = {
    "ANL-CHC": {firstDepartureAfter: 20, duration: 16},
    "ANL-EXG": {firstDepartureAfter: 20, duration: 13},
    "ANL-GLC": {firstDepartureAfter: 25, duration: 20},
    "ANL-GLQ": {firstDepartureAfter: 20, duration: 18},
    "CHC-ANL": {firstDepartureAfter: 12, duration: 18},
    "EXG-ANL": {firstDepartureAfter: 15, duration: 15},
    "GLC-ANL": {firstDepartureAfter: 14, duration: 20},
    "GLQ-ANL": {firstDepartureAfter: 10, duration: 18},
    "GLQ-KVD": {firstDepartureAfter: 12, duration: 15},
    "KVD-GLQ": {firstDepartureAfter: 12, duration: 15},
};

export function createMockJourneys(
    pairs: ResolvedStationPair[],
    now: number,
    recommendJourney: boolean
): Journey[] {
    const journeys = pairs
        .flatMap((pair) => createPairJourneys(pair, now))
        .sort(
            (first, second) =>
                first.segments.at(0)!.start - second.segments.at(0)!.start
        );

    if (!recommendJourney) {
        return journeys;
    }

    const recommendedJourney = [...journeys]
        .filter(
            (journey) =>
                journey.walkingTimesKnown &&
                journey.segments.at(0)!.start >= now
        )
        .sort((first, second) => {
            const arrivalDifference =
                first.segments.at(-1)!.end - second.segments.at(-1)!.end;

            if (arrivalDifference !== 0) {
                return arrivalDifference;
            }

            return first.segments.at(0)!.start - second.segments.at(0)!.start;
        })
        .at(0);

    return journeys.map((journey) => ({
        ...journey,
        recommended: journey === recommendedJourney,
    }));
}

function createPairJourneys(pair: ResolvedStationPair, now: number): Journey[] {
    const route = mockRoutes[`${pair.origin.crs}-${pair.destination.crs}`];

    if (!route) {
        return [];
    }

    return [route.firstDepartureAfter, route.firstDepartureAfter + 30].map(
        (departureAfter) => {
            const departure = now + departureAfter;
            const arrival = departure + route.duration;
            const walkingTimesKnown =
                pair.origin.walkMinutes !== undefined &&
                pair.destination.walkMinutes !== undefined;
            const finish =
                pair.destination.walkMinutes === undefined
                    ? arrival
                    : arrival + pair.destination.walkMinutes;
            const segments: Journey["segments"] = [];

            if (
                pair.origin.walkMinutes !== undefined &&
                pair.origin.walkMinutes > 0
            ) {
                segments.push({
                    kind: "walk",
                    start: departure - pair.origin.walkMinutes,
                    end: departure,
                });
            }

            segments.push({
                kind: "train",
                start: departure,
                end: arrival,
            });

            if (
                pair.destination.walkMinutes !== undefined &&
                pair.destination.walkMinutes > 0
            ) {
                segments.push({
                    kind: "walk",
                    start: arrival,
                    end: finish,
                });
            }

            return {
                id: `${pair.id}:${departure}`,
                origin: pair.origin.crs,
                destination: pair.destination.crs,
                label: `${stationName(pair.origin.crs)} → ${stationName(pair.destination.crs)} · ${formatTime(departure)}`,
                railArrivalTime: formatTime(arrival),
                arrivalLabel:
                    pair.destination.walkMinutes === undefined
                        ? undefined
                        : pair.destination.locationName,
                arrivalTime:
                    pair.destination.walkMinutes === undefined
                        ? undefined
                        : formatTime(finish),
                boldArrivalTime:
                    pair.destination.walkMinutes !== undefined &&
                    pair.destination.locationName.toLowerCase() === "home",
                walkingTimesKnown,
                segments,
            };
        }
    );
}

function formatTime(minutes: number): string {
    const normalisedMinutes = minutes % (24 * 60);
    const hours = Math.floor(normalisedMinutes / 60);
    const remainingMinutes = normalisedMinutes % 60;

    return `${hours}:${remainingMinutes.toString().padStart(2, "0")}`;
}
