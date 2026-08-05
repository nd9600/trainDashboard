import {describe, expect, it} from "vitest";
import {manchesterDashboardConfig} from "../testing/manchesterDashboardConfig.fixture";
import {
    dashboardConfigErrorMessages,
    dashboardConfigSchema,
} from "./dashboardConfig.dto";

describe("dashboardConfigSchema", () => {
    it("rejects a journey that is not used by a schedule", () => {
        const config = structuredClone(manchesterDashboardConfig);
        const journeyId = config.journeys.at(0)!.id;

        for (const schedule of config.schedules) {
            if (schedule.primaryJourneyId === journeyId) {
                schedule.primaryJourneyId = config.journeys.at(1)!.id;
            }
            schedule.secondaryJourneyIds = schedule.secondaryJourneyIds.filter(
                (candidate) => candidate !== journeyId
            );
        }

        const result = dashboardConfigSchema.safeParse(config);

        expect(result.success).toBe(false);
        expect(result.error?.issues).toContainEqual(
            expect.objectContaining({
                message: "Journey must be used by at least one schedule.",
                path: ["journeys", 0],
            })
        );
    });

    it("describes an invalid station without exposing its data path", () => {
        const config = structuredClone(manchesterDashboardConfig);
        config.stationGroups[0]!.stations[0]!.crs = "not-a-station";

        const result = dashboardConfigSchema.safeParse(config);

        expect(result.success).toBe(false);
        expect(dashboardConfigErrorMessages(result.error!)).toContain(
            "Station group 1, station 1: Enter a valid CRS station code."
        );
    });

    it("rejects duplicate stations in one group", () => {
        const config = structuredClone(manchesterDashboardConfig);
        config.stationGroups[0]!.stations[1]!.crs = "HTC";

        const result = dashboardConfigSchema.safeParse(config);

        expect(result.success).toBe(false);
        expect(result.error?.issues).toContainEqual(
            expect.objectContaining({
                message:
                    "Choose a different station. This station is already in the group.",
                path: ["stationGroups", 0, "stations", 1, "crs"],
            })
        );
    });

    it("rejects journeys with the same station pair", () => {
        const config = structuredClone(manchesterDashboardConfig);
        config.journeys[1]!.origin = config.journeys[0]!.origin;
        config.journeys[1]!.destination = config.journeys[0]!.destination;

        const result = dashboardConfigSchema.safeParse(config);

        expect(result.success).toBe(false);
        expect(result.error?.issues).toContainEqual(
            expect.objectContaining({
                message: "This station pair is already used by Journey 1.",
                path: ["journeys", 1],
            })
        );
    });
});
