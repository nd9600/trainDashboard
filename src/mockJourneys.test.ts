import {describe, expect, it} from "vitest";
import type {ResolvedStationPair} from "./config/resolveDashboardConfig";
import {createMockJourneys} from "./mockJourneys";

describe("createMockJourneys", () => {
    it("uses the walking times from a configured station pair", () => {
        const journeys = createMockJourneys(
            [resolvedPair("ANL", "CHC", 15, 8)],
            8 * 60,
            false
        );

        expect(journeys[0]).toMatchObject({
            origin: "ANL",
            destination: "CHC",
            arrivalLabel: "work",
            arrivalTime: "8:44",
            segments: [
                {kind: "walk", start: 8 * 60 + 5, end: 8 * 60 + 20},
                {kind: "train", start: 8 * 60 + 20, end: 8 * 60 + 36},
                {kind: "walk", start: 8 * 60 + 36, end: 8 * 60 + 44},
            ],
        });
    });

    it("recommends the catchable journey with the earliest finish", () => {
        const journeys = createMockJourneys(
            [
                resolvedPair("ANL", "CHC", 15, 8),
                resolvedPair("ANL", "EXG", 15, 15),
            ],
            8 * 60,
            true
        );

        expect(journeys.filter((journey) => journey.recommended)).toHaveLength(
            1
        );
        expect(
            journeys.find((journey) => journey.recommended)?.destination
        ).toBe("CHC");
    });

    it("omits a pair until timetable data is available for it", () => {
        const journeys = createMockJourneys(
            [resolvedPair("EDB", "GLQ", 0, 0)],
            17 * 60,
            false
        );

        expect(journeys).toEqual([]);
    });
});

function resolvedPair(
    origin: string,
    destination: string,
    originWalkMinutes: number,
    destinationWalkMinutes: number
): ResolvedStationPair {
    return {
        id: `pair:${origin}-${destination}`,
        pairId: "pair",
        origin: {
            crs: origin,
            walkMinutes: originWalkMinutes,
            locationName: "Home",
        },
        destination: {
            crs: destination,
            walkMinutes: destinationWalkMinutes,
            locationName: "Work",
        },
    };
}
