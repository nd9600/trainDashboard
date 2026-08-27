import {afterEach, describe, expect, it, vi} from "vitest";
import {manchesterDashboardConfig} from "../testing/manchesterDashboardConfig.fixture";
import * as railDataMarketplaceApi from "../api/railDataMarketplace.api";
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
            "heaton-chapel-to-liverpool"
        );

        expect(result.activeSchedule?.id).toBe("weekday-morning");
        expect(result.activeJourneyId).toBe("heaton-chapel-to-liverpool");
        expect(new Set(result.routes.map((route) => route.journeyId))).toEqual(
            new Set(["heaton-chapel-to-liverpool"])
        );
    });
});
