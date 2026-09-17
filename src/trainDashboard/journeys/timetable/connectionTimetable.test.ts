import {afterEach, describe, expect, it, vi} from "vitest";
import {service} from "../../testing/departureService.fixture";
import {
    testApiAt,
    mockDepartureBoards,
    journeyRoute,
    getTimetabledJourneys,
} from "./journeyTimetable.fixture";
import {formatApiTime} from "../../testing/departureService.fixture";
import * as railDataMarketplaceApi from "../../api/railDataMarketplace.api";

describe("connection timetable planning", () => {
    afterEach(() => vi.restoreAllMocks());
    it("combines direct services through a configured connecting station", async () => {
        const journeys = await getTimetabledJourneys(
            testApiAt(15 * 60),
            [journeyRoute("BNA", "LIV", 5, 0, "MAN")],
            15 * 60
        );

        expect(journeys[0]).toMatchObject({
            origin: "BNA",
            destination: "LIV",
            railArrivalTime: "16:20",
            segments: [
                {kind: "walk", start: 15 * 60 + 5, end: 15 * 60 + 10},
                {kind: "train", start: 15 * 60 + 10, end: 15 * 60 + 25},
                {kind: "wait", start: 15 * 60 + 25, end: 15 * 60 + 30},
                {kind: "train", start: 15 * 60 + 30, end: 16 * 60 + 20},
            ],
            trainLegs: [
                {
                    origin: "BNA",
                    destination: "MAN",
                    departure: 15 * 60 + 10,
                    arrival: 15 * 60 + 25,
                },
                {
                    origin: "MAN",
                    destination: "LIV",
                    departure: 15 * 60 + 30,
                    arrival: 16 * 60 + 20,
                },
            ],
        });
    });

    it("finds an onward train after the first catchable transfer time", async () => {
        vi.spyOn(railDataMarketplaceApi, "fetchDepartureBoard").mockImplementation(
            async (_consumerKey, request) => {
                if (request.destinationCrs === "GLQ") {
                    return {
                        crs: "EDB",
                        trainServices: [service("fast-first-train", "18:15", "GLQ", "19:06")],
                    };
                }

                return {
                    crs: "GLQ",
                    trainServices:
                        request.timeOffsetMinutes === 0
                            ? Array.from({length: 10}, (_, index) =>
                                  service(
                                      `too-early-${index}`,
                                      formatApiTime(18 * 60 + 5 + index * 7),
                                      "CHC",
                                      formatApiTime(18 * 60 + 7 + index * 7)
                                  )
                              )
                            : [service("catchable-onward-train", "19:13", "CHC", "19:15")],
                };
            }
        );

        const journeys = await getTimetabledJourneys(
            "test-key",
            [journeyRoute("EDB", "CHC", 0, 0, "GLQ")],
            18 * 60 + 2
        );

        expect(journeys[0]!.trainLegs).toMatchObject([
            {departure: 18 * 60 + 15, arrival: 19 * 60 + 6},
            {departure: 19 * 60 + 13, arrival: 19 * 60 + 15},
        ]);
    });

    it("does not treat one through service as a connection to itself", async () => {
        mockDepartureBoards({
            "HTC-MAN": [service("through", "10:05", "MAN", "10:20")],
            "MAN-LIV": [
                service("through", "10:25", "LIV", "11:20"),
                service("connection", "10:30", "LIV", "11:30"),
            ],
        });

        const journeys = await getTimetabledJourneys(
            "test-key",
            [journeyRoute("HTC", "LIV", 0, 0, "MAN")],
            10 * 60
        );

        expect(journeys).toHaveLength(1);
        expect(journeys[0]!.trainLegs[1]!.departure).toBe(10 * 60 + 30);
    });

    it("requires three minutes to change trains", async () => {
        mockDepartureBoards({
            "HTC-MAN": [service("first-train", "15:10", "MAN", "15:30")],
            "MAN-LIV": [
                service("too-soon", "15:30", "LIV", "16:20"),
                service("catchable", "16:00", "LIV", "16:50"),
            ],
        });

        const journeys = await getTimetabledJourneys(
            "test-key",
            [journeyRoute("HTC", "LIV", 0, 0, "MAN")],
            15 * 60
        );

        expect(journeys[0]!.trainLegs).toMatchObject([
            {arrival: 15 * 60 + 30},
            {departure: 16 * 60},
        ]);
    });
});
