import {afterEach, describe, expect, it, vi} from "vitest";
import {service} from "../../testing/departureService.fixture";
import {
    testApiAt,
    mockDepartureBoards,
    journeyRoute,
    getTimetabledJourneys,
} from "./journeyTimetable.fixture";

describe("journey timetable planning", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });
    it("uses the walking times from a configured journey route", async () => {
        const journeys = await getTimetabledJourneys(
            testApiAt(8 * 60),
            [journeyRoute("HTC", "EDY", 15, 8)],
            8 * 60
        );

        expect(journeys[0]).toMatchObject({
            journeyId: "journeys",
            origin: "HTC",
            originLocationName: "Heaton Chapel",
            destination: "EDY",
            destinationLocationName: "Manchester Piccadilly",
            arrivalLabel: "Manchester Piccadilly",
            arrivalTime: "8:44",
            walkingTimesKnown: true,
            segments: [
                {kind: "walk", start: 8 * 60 + 5, end: 8 * 60 + 20},
                {kind: "train", start: 8 * 60 + 20, end: 8 * 60 + 36},
                {kind: "walk", start: 8 * 60 + 36, end: 8 * 60 + 44},
            ],
        });
    });

    it("recommends the catchable journey with the earliest finish", async () => {
        const journeys = await getTimetabledJourneys(
            testApiAt(8 * 60),
            [journeyRoute("HTC", "EDY", 15, 8), journeyRoute("HTC", "MAN", 15, 15)],
            8 * 60
        );

        expect(journeys.filter((journey) => journey.recommended)).toHaveLength(1);
        expect(journeys.find((journey) => journey.recommended)?.destination).toBe("EDY");
    });

    it("orders journeys by final arrival time", async () => {
        const journeys = await getTimetabledJourneys(
            testApiAt(8 * 60),
            [journeyRoute("HTC", "MAN", 15, 15), journeyRoute("HTC", "EDY", 15, 8)],
            8 * 60
        );

        expect(journeys.slice(0, 2).map((journey) => journey.destination)).toEqual(["EDY", "MAN"]);
        expect(journeys.slice(0, 2).map((journey) => journey.segments.at(-1)!.end)).toEqual([
            8 * 60 + 44,
            8 * 60 + 48,
        ]);
    });

    it("prefers a later departure when journeys finish at the same time", async () => {
        mockDepartureBoards({
            "HTC-EDY": [
                service("early", "10:05", "EDY", "10:30"),
                service("late", "10:15", "EDY", "10:30"),
            ],
        });

        const journeys = await getTimetabledJourneys(
            "test-key",
            [journeyRoute("HTC", "EDY", 0, 0)],
            10 * 60
        );

        expect(journeys.map((journey) => journey.trainLegs[0]!.departure)).toEqual([
            10 * 60 + 15,
            10 * 60 + 5,
        ]);
    });

    it("does not show a journey when its walk has already started", async () => {
        const journeys = await getTimetabledJourneys(
            testApiAt(8 * 60),
            [journeyRoute("HTC", "EDY", 25, 8)],
            8 * 60
        );

        expect(journeys).toHaveLength(1);
        expect(journeys[0]!.trainLegs[0]!.departure).toBe(8 * 60 + 50);
        expect(journeys[0]!.segments.at(0)!.start).toBe(8 * 60 + 25);
    });

    it("omits a journey until timetable data is available for it", async () => {
        const journeys = await getTimetabledJourneys(
            testApiAt(17 * 60),
            [journeyRoute("LIV", "MAN", 0, 0)],
            17 * 60
        );

        expect(journeys).toEqual([]);
    });

    it("shows rail segments without personalised times when walking times are unknown", async () => {
        const journeys = await getTimetabledJourneys(
            testApiAt(8 * 60),
            [journeyRoute("HTC", "EDY", undefined, undefined)],
            8 * 60
        );

        expect(journeys[0]).toMatchObject({
            arrivalLabel: undefined,
            arrivalTime: undefined,
            railArrivalTime: "8:36",
            recommended: false,
            walkingTimesKnown: false,
            segments: [{kind: "train", start: 8 * 60 + 20, end: 8 * 60 + 36}],
        });
    });

    it("uses live times when the service is delayed", async () => {
        mockDepartureBoards({
            "HTC-EDY": [service("delayed-service", "08:20", "EDY", "08:36", "08:25", "08:41")],
        });

        const journeys = await getTimetabledJourneys(
            "test-key",
            [journeyRoute("HTC", "EDY", 15, 8)],
            8 * 60
        );

        expect(journeys[0]).toMatchObject({
            railArrivalTime: "8:41",
            arrivalTime: "8:49",
            segments: [
                {kind: "walk", start: 8 * 60 + 10, end: 8 * 60 + 25},
                {kind: "train", start: 8 * 60 + 25, end: 8 * 60 + 41},
                {kind: "walk", start: 8 * 60 + 41, end: 8 * 60 + 49},
            ],
        });
    });
});
