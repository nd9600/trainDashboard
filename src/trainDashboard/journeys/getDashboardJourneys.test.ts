import {afterEach, describe, expect, it, vi} from "vitest";
import {manchesterDashboardConfig} from "../testing/manchesterDashboardConfig.fixture";
import * as railDataMarketplaceApi from "../api/railDataMarketplace.api";
import {createEphemeralJourney} from "../dto/journeySelection.dto";
import {getDashboardJourneys} from "./getDashboardJourneys";

describe("getDashboardJourneys", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("selects and expands configured journeys without an API key", async () => {
        const result = await getDashboardJourneys(
            manchesterDashboardConfig,
            {day: 1, minutes: 8 * 60},
            ""
        );

        expect(result.activeSchedule?.id).toBe("weekday-morning");
        expect(result.routes.map((route) => route.journeyId)).toEqual([
            "heaton-chapel-to-manchester-piccadilly",
            "heaton-chapel-to-manchester-piccadilly",
        ]);
        expect(result.journeys).toEqual([]);
    });

    it("runs the complete pipeline for the scheduled journey", async () => {
        vi.spyOn(
            railDataMarketplaceApi,
            "fetchDepartureBoard"
        ).mockImplementation(async (_consumerKey, request) => ({
            crs: request.originCrs,
            trainServices: [
                {
                    serviceID: `${request.originCrs}-${request.destinationCrs}`,
                    std: "08:20",
                    etd: "On time",
                    isCancelled: false,
                    subsequentCallingPoints: [
                        {
                            callingPoint: [
                                {
                                    crs: request.destinationCrs,
                                    st: "08:40",
                                    et: "On time",
                                },
                            ],
                        },
                    ],
                },
            ],
        }));

        const result = await getDashboardJourneys(
            manchesterDashboardConfig,
            {day: 1, minutes: 8 * 60},
            "test-key"
        );

        expect(result.journeys).toHaveLength(2);
        expect(
            result.journeys.find((journey) => journey.recommended)?.destination
        ).toBe("EDY");
    });

    it("uses a temporary saved journey instead of the scheduled journey", async () => {
        const result = await getDashboardJourneys(
            manchesterDashboardConfig,
            {day: 1, minutes: 8 * 60},
            "",
            {
                temporaryJourney: manchesterDashboardConfig.journeys.find(
                    (journey) => journey.id === "heaton-chapel-to-liverpool"
                ),
            }
        );

        expect(result.activeSchedule?.id).toBe("weekday-morning");
        expect(result.activeJourneyId).toBe("heaton-chapel-to-liverpool");
        expect(new Set(result.routes.map((route) => route.journeyId))).toEqual(
            new Set(["heaton-chapel-to-liverpool"])
        );
    });

    it("uses recent history when no schedule is active", async () => {
        const config = structuredClone(manchesterDashboardConfig);
        config.schedules = [];

        const result = await getDashboardJourneys(
            config,
            {day: 1, minutes: 8 * 60},
            "",
            {
                recentJourneyHistory: [
                    {
                        type: "saved",
                        journeyId: "heaton-chapel-to-liverpool",
                        selectedAt: "2026-08-27T08:00:00.000Z",
                    },
                ],
            }
        );

        expect(result.activeSchedule).toBeUndefined();
        expect(result.activeJourneyId).toBe("heaton-chapel-to-liverpool");
        expect(new Set(result.routes.map((route) => route.journeyId))).toEqual(
            new Set(["heaton-chapel-to-liverpool"])
        );
    });

    it("expands a temporary station-to-station journey", async () => {
        const journey = createEphemeralJourney({
            origin: {type: "station", crs: "MAN"},
            destination: {type: "station", crs: "LIV"},
        })!;

        const result = await getDashboardJourneys(
            manchesterDashboardConfig,
            {day: 1, minutes: 8 * 60},
            "",
            {temporaryJourney: journey}
        );

        expect(result.activeJourneyId).toBe("ephemeral:MAN-LIV");
        expect(result.routes).toEqual([
            expect.objectContaining({
                journeyId: "ephemeral:MAN-LIV",
                origin: expect.objectContaining({crs: "MAN"}),
                destination: expect.objectContaining({crs: "LIV"}),
            }),
        ]);
    });

    it("expands a possible connection for a temporary journey", async () => {
        const journey = createEphemeralJourney({
            origin: {type: "station", crs: "MAN"},
            destination: {type: "station", crs: "LIV"},
            viaCrs: "CRE",
        })!;

        const result = await getDashboardJourneys(
            manchesterDashboardConfig,
            {day: 1, minutes: 8 * 60},
            "",
            {temporaryJourney: journey}
        );

        expect(result.routes.map((route) => route.viaCrs)).toEqual([
            undefined,
            "CRE",
        ]);
    });
});
