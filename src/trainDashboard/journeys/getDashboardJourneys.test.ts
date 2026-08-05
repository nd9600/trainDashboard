import {afterEach, describe, expect, it, vi} from "vitest";
import {defaultDashboardConfig} from "../config/defaultDashboardConfig";
import * as railDataMarketplaceApi from "../api/railDataMarketplace.api";
import {getDashboardJourneys} from "./getDashboardJourneys";

describe("getDashboardJourneys", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("selects and expands configured journeys without an API key", async () => {
        const result = await getDashboardJourneys(
            defaultDashboardConfig,
            {day: 1, minutes: 8 * 60},
            ""
        );

        expect(result.activeSchedule?.id).toBe("weekday-morning");
        expect(result.primaryRoutes.map((route) => route.journeyId)).toEqual([
            "home-to-work",
            "home-to-work",
        ]);
        expect(result.secondaryRoutes.map((route) => route.journeyId)).toEqual([
            "home-to-glasgow",
            "home-to-glasgow",
            "home-to-glasgow",
            "home-to-glasgow",
        ]);
        expect(result.primaryJourneys).toEqual([]);
        expect(result.secondaryJourneys).toEqual([]);
    });

    it("runs the complete pipeline for primary and secondary journeys", async () => {
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
            defaultDashboardConfig,
            {day: 1, minutes: 8 * 60},
            "test-key"
        );

        expect(result.primaryJourneys).toHaveLength(2);
        expect(
            result.primaryJourneys.find((journey) => journey.recommended)
                ?.destination
        ).toBe("CHC");
        expect(result.secondaryJourneys).toHaveLength(4);
    });
});
