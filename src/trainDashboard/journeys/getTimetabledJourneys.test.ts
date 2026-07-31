import {afterEach, describe, expect, it, vi} from "vitest";
import type {DepartureBoardRequest} from "../api/railDataMarketplace.api";
import * as railDataMarketplaceApi from "../api/railDataMarketplace.api";
import type {JourneyRoute} from "./getCurrentJourneyPriorities";
import {getTimetabledJourneys} from "./getTimetabledJourneys";

describe("getTimetabledJourneys", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });
    it("uses the walking times from a configured journey route", async () => {
        const journeys = await getTimetabledJourneys(
            testApiAt(8 * 60),
            [journeyRoute("ANL", "CHC", 15, 8)],
            8 * 60,
            false
        );

        expect(journeys[0]).toMatchObject({
            origin: "ANL",
            destination: "CHC",
            contextLabel: "Home to Work",
            arrivalLabel: "Work",
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
            [
                journeyRoute("ANL", "CHC", 15, 8),
                journeyRoute("ANL", "EXG", 15, 15),
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

    it("orders journeys by final arrival time", async () => {
        const journeys = await getTimetabledJourneys(
            testApiAt(8 * 60),
            [
                journeyRoute("ANL", "EXG", 15, 15),
                journeyRoute("ANL", "CHC", 15, 8),
            ],
            8 * 60,
            false
        );

        expect(
            journeys.slice(0, 2).map((journey) => journey.destination)
        ).toEqual(["CHC", "EXG"]);
        expect(
            journeys.slice(0, 2).map((journey) => journey.segments.at(-1)!.end)
        ).toEqual([8 * 60 + 44, 8 * 60 + 48]);
    });

    it("does not show a journey when its walk has already started", async () => {
        const journeys = await getTimetabledJourneys(
            testApiAt(8 * 60),
            [journeyRoute("ANL", "CHC", 25, 8)],
            8 * 60,
            false
        );

        expect(journeys).toHaveLength(1);
        expect(journeys[0]!.trainLegs[0]!.departure).toBe(8 * 60 + 50);
        expect(journeys[0]!.segments.at(0)!.start).toBe(8 * 60 + 25);
    });

    it("requests departures only after the origin walking time", async () => {
        const requests: DepartureBoardRequest[] = [];
        vi.spyOn(
            railDataMarketplaceApi,
            "getDepartureBoard"
        ).mockImplementation(async (_consumerKey, request) => {
            requests.push(request);
            return {crs: request.originCrs, trainServices: []};
        });

        await getTimetabledJourneys(
            "test-key",
            [journeyRoute("ANL", "CHC", 15, 8)],
            8 * 60,
            false
        );

        expect(requests).toEqual([
            expect.objectContaining({timeOffsetMinutes: 15}),
        ]);
    });

    it("omits a journeys until timetable data is available for it", async () => {
        const journeys = await getTimetabledJourneys(
            testApiAt(17 * 60),
            [journeyRoute("EDB", "GLQ", 0, 0)],
            17 * 60,
            false
        );

        expect(journeys).toEqual([]);
    });

    it("shows rail segments without personalised times when walking times are unknown", async () => {
        const journeys = await getTimetabledJourneys(
            testApiAt(8 * 60),
            [journeyRoute("ANL", "CHC", undefined, undefined)],
            8 * 60,
            true
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
        vi.spyOn(railDataMarketplaceApi, "getDepartureBoard").mockResolvedValue(
            {
                crs: "ANL",
                trainServices: [
                    {
                        serviceID: "delayed-service",
                        std: "08:20",
                        etd: "08:25",
                        isCancelled: false,
                        subsequentCallingPoints: [
                            {
                                callingPoint: [
                                    {
                                        crs: "CHC",
                                        st: "08:36",
                                        et: "08:41",
                                    },
                                ],
                            },
                        ],
                    },
                ],
            }
        );

        const journeys = await getTimetabledJourneys(
            "test-key",
            [journeyRoute("ANL", "CHC", 15, 8)],
            8 * 60,
            false
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

    it("combines direct services through a configured connecting station", async () => {
        const journeys = await getTimetabledJourneys(
            testApiAt(15 * 60),
            [journeyRoute("KVD", "EDB", 5, 0, "GLQ")],
            15 * 60,
            false
        );

        expect(journeys[0]).toMatchObject({
            origin: "KVD",
            destination: "EDB",
            railArrivalTime: "16:20",
            segments: [
                {kind: "walk", start: 15 * 60 + 5, end: 15 * 60 + 10},
                {kind: "train", start: 15 * 60 + 10, end: 15 * 60 + 25},
                {kind: "wait", start: 15 * 60 + 25, end: 15 * 60 + 30},
                {kind: "train", start: 15 * 60 + 30, end: 16 * 60 + 20},
            ],
            trainLegs: [
                {
                    origin: "KVD",
                    destination: "GLQ",
                    departure: 15 * 60 + 10,
                    arrival: 15 * 60 + 25,
                },
                {
                    origin: "GLQ",
                    destination: "EDB",
                    departure: 15 * 60 + 30,
                    arrival: 16 * 60 + 20,
                },
            ],
        });
    });

    it("requires three minutes to change trains", async () => {
        const journeys = await getTimetabledJourneys(
            testApiAt(15 * 60),
            [journeyRoute("ANL", "EDB", 0, 0, "GLQ")],
            15 * 60,
            false
        );

        expect(journeys[0]!.trainLegs).toMatchObject([
            {arrival: 15 * 60 + 30},
            {departure: 16 * 60},
        ]);
    });
});

function testApiAt(now: number): string {
    const routes: Record<string, {departureAfter: number; duration: number}> = {
        "ANL-CHC": {departureAfter: 20, duration: 16},
        "ANL-EXG": {departureAfter: 20, duration: 13},
        "ANL-GLQ": {departureAfter: 10, duration: 20},
        "GLQ-EDB": {departureAfter: 30, duration: 50},
        "KVD-GLQ": {departureAfter: 10, duration: 15},
    };

    vi.spyOn(railDataMarketplaceApi, "getDepartureBoard").mockImplementation(
        async (_consumerKey, request) => {
            const route =
                routes[`${request.originCrs}-${request.destinationCrs}`];

            if (!route) {
                return {
                    crs: request.originCrs,
                    trainServices: [],
                };
            }

            return {
                crs: request.originCrs,
                trainServices: [
                    route.departureAfter,
                    route.departureAfter + 30,
                ].map((departureAfter) => {
                    const departure = now + departureAfter;
                    const arrival = departure + route.duration;

                    return {
                        serviceID: `${request.originCrs}-${request.destinationCrs}-${departure}`,
                        std: formatApiTime(departure),
                        etd: "On time",
                        isCancelled: false,
                        subsequentCallingPoints: [
                            {
                                callingPoint: [
                                    {
                                        crs: request.destinationCrs,
                                        st: formatApiTime(arrival),
                                        et: "On time",
                                    },
                                ],
                            },
                        ],
                    };
                }),
            };
        }
    );

    return "test-key";
}

function formatApiTime(minutes: number): string {
    const normalisedMinutes = ((minutes % 1440) + 1440) % 1440;
    const hours = Math.floor(normalisedMinutes / 60);
    const remainingMinutes = normalisedMinutes % 60;

    return `${hours.toString().padStart(2, "0")}:${remainingMinutes
        .toString()
        .padStart(2, "0")}`;
}

function journeyRoute(
    origin: string,
    destination: string,
    originWalkMinutes: number | undefined,
    destinationWalkMinutes: number | undefined,
    viaCrs?: string
): JourneyRoute {
    return {
        id: `journeys:${origin}-${destination}`,
        journeyId: "journeys",
        contextLabel: "Home to Work",
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
        viaCrs,
    };
}
