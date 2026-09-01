import {afterEach, describe, expect, it, vi} from "vitest";
import type {DepartureBoardRequest} from "../../api/railDataMarketplace.api";
import * as railDataMarketplaceApi from "../../api/railDataMarketplace.api";
import type {JourneyRoute} from "../planning/journeyRoutes";
import {
    getDepartureBoards,
    type DepartureBoardRequestCache,
} from "./departureBoards";
import {getTrainOptions} from "./trainOptions";
import {
    makeTimetabledJourneys,
    getCatchableJourneys,
    markRecommendedJourney,
    sortJourneysByArrival,
} from "./timetabledJourneys";

describe("journey timetable stages", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });
    it("uses the walking times from a configured journey route", async () => {
        const journeys = await getTimetabledJourneys(
            testApiAt(8 * 60),
            [journeyRoute("HTC", "EDY", 15, 8)],
            8 * 60,
            false
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
            [
                journeyRoute("HTC", "EDY", 15, 8),
                journeyRoute("HTC", "MAN", 15, 15),
            ],
            8 * 60,
            true
        );

        expect(journeys.filter((journey) => journey.recommended)).toHaveLength(
            1
        );
        expect(
            journeys.find((journey) => journey.recommended)?.destination
        ).toBe("EDY");
    });

    it("orders journeys by final arrival time", async () => {
        const journeys = await getTimetabledJourneys(
            testApiAt(8 * 60),
            [
                journeyRoute("HTC", "MAN", 15, 15),
                journeyRoute("HTC", "EDY", 15, 8),
            ],
            8 * 60,
            false
        );

        expect(
            journeys.slice(0, 2).map((journey) => journey.destination)
        ).toEqual(["EDY", "MAN"]);
        expect(
            journeys.slice(0, 2).map((journey) => journey.segments.at(-1)!.end)
        ).toEqual([8 * 60 + 44, 8 * 60 + 48]);
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
            10 * 60,
            false
        );

        expect(
            journeys.map((journey) => journey.trainLegs[0]!.departure)
        ).toEqual([10 * 60 + 15, 10 * 60 + 5]);
    });

    it("does not show a journey when its walk has already started", async () => {
        const journeys = await getTimetabledJourneys(
            testApiAt(8 * 60),
            [journeyRoute("HTC", "EDY", 25, 8)],
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
            "fetchDepartureBoard"
        ).mockImplementation(async (_consumerKey, request) => {
            requests.push(request);
            return {crs: request.originCrs, trainServices: []};
        });

        await getTimetabledJourneys(
            "test-key",
            [journeyRoute("HTC", "EDY", 15, 8)],
            8 * 60,
            false
        );

        expect(requests).toEqual([
            expect.objectContaining({timeOffsetMinutes: 15}),
        ]);
    });

    it("reuses a departure board cache across journey groups", async () => {
        testApiAt(8 * 60);
        const departureBoardRequestCache: DepartureBoardRequestCache =
            new Map();
        const route = journeyRoute("HTC", "EDY", 15, 8);

        await getTimetabledJourneys(
            "test-key",
            [route],
            8 * 60,
            false,
            departureBoardRequestCache
        );
        await getTimetabledJourneys(
            "test-key",
            [route],
            8 * 60,
            false,
            departureBoardRequestCache
        );

        expect(departureBoardRequestCache).toHaveLength(1);
    });

    it("omits a journeys until timetable data is available for it", async () => {
        const journeys = await getTimetabledJourneys(
            testApiAt(17 * 60),
            [journeyRoute("LIV", "MAN", 0, 0)],
            17 * 60,
            false
        );

        expect(journeys).toEqual([]);
    });

    it("shows rail segments without personalised times when walking times are unknown", async () => {
        const journeys = await getTimetabledJourneys(
            testApiAt(8 * 60),
            [journeyRoute("HTC", "EDY", undefined, undefined)],
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
        vi.spyOn(
            railDataMarketplaceApi,
            "fetchDepartureBoard"
        ).mockResolvedValue({
            crs: "HTC",
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
                                    crs: "EDY",
                                    st: "08:36",
                                    et: "08:41",
                                },
                            ],
                        },
                    ],
                },
            ],
        });

        const journeys = await getTimetabledJourneys(
            "test-key",
            [journeyRoute("HTC", "EDY", 15, 8)],
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
            [journeyRoute("BNA", "LIV", 5, 0, "MAN")],
            15 * 60,
            false
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

    it("requests onward trains from the first catchable transfer time", async () => {
        const requests: DepartureBoardRequest[] = [];
        vi.spyOn(
            railDataMarketplaceApi,
            "fetchDepartureBoard"
        ).mockImplementation(async (_consumerKey, request) => {
            requests.push(request);

            if (request.destinationCrs === "GLQ") {
                return {
                    crs: "EDB",
                    trainServices: [
                        service("fast-first-train", "18:15", "GLQ", "19:06"),
                    ],
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
                        : [
                              service(
                                  "catchable-onward-train",
                                  "19:13",
                                  "CHC",
                                  "19:15"
                              ),
                          ],
            };
        });

        const journeys = await getTimetabledJourneys(
            "test-key",
            [journeyRoute("EDB", "CHC", 0, 0, "GLQ")],
            18 * 60 + 2,
            false
        );

        expect(requests.map((request) => request.timeOffsetMinutes)).toEqual([
            0, 67,
        ]);
        expect(journeys[0]!.trainLegs).toMatchObject([
            {departure: 18 * 60 + 15, arrival: 19 * 60 + 6},
            {departure: 19 * 60 + 13, arrival: 19 * 60 + 15},
        ]);
    });

    it("shows slower onward trains as alternatives", async () => {
        mockDepartureBoards({
            "HTC-MAN": [service("first-train", "10:05", "MAN", "10:20")],
            "MAN-LIV": [
                service("slower", "10:25", "LIV", "11:30"),
                service("faster", "10:35", "LIV", "11:20"),
            ],
        });

        const journeys = await getTimetabledJourneys(
            "test-key",
            [journeyRoute("HTC", "LIV", 0, 0, "MAN")],
            10 * 60,
            false
        );

        expect(journeys).toHaveLength(1);
        expect(journeys[0]!.trainLegs[1]).toMatchObject({
            departure: 10 * 60 + 35,
            arrival: 11 * 60 + 20,
        });
        expect(journeys[0]!.trainLegs[1]!.alternativeTrainLegs).toEqual([
            expect.objectContaining({
                departure: 10 * 60 + 25,
                arrival: 11 * 60 + 30,
            }),
        ]);
    });

    it("uses the latest first train for the same onward service", async () => {
        mockDepartureBoards({
            "HTC-MAN": [
                service("early-first-train", "10:05", "MAN", "10:20"),
                service("late-first-train", "10:15", "MAN", "10:30"),
            ],
            "MAN-LIV": [service("onward", "10:40", "LIV", "11:20")],
        });

        const journeys = await getTimetabledJourneys(
            "test-key",
            [journeyRoute("HTC", "LIV", 0, 0, "MAN")],
            10 * 60,
            false
        );

        expect(journeys).toHaveLength(1);
        expect(journeys[0]!.trainLegs[0]!.departure).toBe(10 * 60 + 15);
        expect(journeys[0]!.trainLegs[0]!.alternativeTrainLegs).toEqual([
            expect.objectContaining({departure: 10 * 60 + 5}),
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
            10 * 60,
            false
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
        "HTC-EDY": {departureAfter: 20, duration: 16},
        "HTC-MAN": {departureAfter: 20, duration: 13},
        "MAN-LIV": {departureAfter: 30, duration: 50},
        "BNA-MAN": {departureAfter: 10, duration: 15},
    };

    vi.spyOn(railDataMarketplaceApi, "fetchDepartureBoard").mockImplementation(
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

function mockDepartureBoards(
    servicesByRoute: Record<string, ReturnType<typeof service>[]>
): void {
    vi.spyOn(railDataMarketplaceApi, "fetchDepartureBoard").mockImplementation(
        async (_consumerKey, request) => ({
            crs: request.originCrs,
            trainServices:
                servicesByRoute[
                    `${request.originCrs}-${request.destinationCrs}`
                ] ?? [],
        })
    );
}

function service(
    serviceID: string,
    departure: string,
    destinationCrs: string,
    arrival: string
) {
    return {
        serviceID,
        std: departure,
        etd: "On time",
        isCancelled: false,
        subsequentCallingPoints: [
            {
                callingPoint: [
                    {
                        crs: destinationCrs,
                        st: arrival,
                        et: "On time",
                    },
                ],
            },
        ],
    };
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
        origin: {
            crs: origin,
            walkMinutes: originWalkMinutes,
            locationName: "Heaton Chapel",
        },
        destination: {
            crs: destination,
            walkMinutes: destinationWalkMinutes,
            locationName: "Manchester Piccadilly",
        },
        viaCrs,
    };
}

async function getTimetabledJourneys(
    consumerKey: string,
    stationRoutes: JourneyRoute[],
    currentMinutes: number,
    recommendJourney: boolean,
    requestCache: DepartureBoardRequestCache = new Map()
) {
    const departureBoards = await getDepartureBoards(
        consumerKey,
        stationRoutes,
        currentMinutes,
        requestCache
    );
    const trainOptions = getTrainOptions(
        stationRoutes,
        departureBoards,
        currentMinutes
    );
    const journeysWithSections = makeTimetabledJourneys(trainOptions);
    const catchableJourneys = getCatchableJourneys(
        journeysWithSections,
        currentMinutes
    );
    const journeysSortedByArrival = sortJourneysByArrival(catchableJourneys);

    return recommendJourney
        ? markRecommendedJourney(journeysSortedByArrival)
        : journeysSortedByArrival;
}
