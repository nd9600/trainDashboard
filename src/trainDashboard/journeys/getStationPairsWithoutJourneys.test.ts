import {describe, expect, it} from "vitest";
import type {Journey} from "../dto/journey.dto";
import type {ResolvedStationPair} from "./getCurrentJourneyPriorities";
import {getStationPairsWithoutJourneys} from "./getStationPairsWithoutJourneys";

describe("getStationPairsWithoutJourneys", () => {
    it("returns each station pair that has no loaded journey", () => {
        const pairs = [resolvedPair("ANL", "EDB"), resolvedPair("KVD", "EDB")];
        const journeys = [journey("ANL", "EDB")];

        expect(getStationPairsWithoutJourneys(pairs, journeys)).toEqual([
            pairs[1],
        ]);
    });
});

function resolvedPair(
    origin: string,
    destination: string
): ResolvedStationPair {
    return {
        id: `home-to-wendys:${origin}-${destination}`,
        pairId: "home-to-wendys",
        contextLabel: "Home to Wendy's",
        origin: {crs: origin, locationName: "Home"},
        destination: {crs: destination, locationName: "Wendy's"},
    };
}

function journey(origin: string, destination: string): Journey {
    return {
        id: `${origin}-${destination}:1700`,
        origin,
        destination,
        contextLabel: "Home to Wendy's",
        railArrivalTime: "18:00",
        walkingTimesKnown: false,
        segments: [{kind: "train", start: 17 * 60, end: 18 * 60}],
        trainLegs: [
            {
                origin,
                destination,
                departure: 17 * 60,
                arrival: 18 * 60,
            },
        ],
    };
}
