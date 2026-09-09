import {DashboardConfigSchema} from "./dashboardConfig.dto";
import {describe, expect, it} from "vitest";
import {manchesterDashboardConfig} from "../testing/manchesterDashboardConfig.fixture";
import {dashboardConfigErrorMessages} from "./dashboardConfigDraft.dto";

describe("DashboardConfigSchema", () => {
    it("describes an invalid station without exposing its data path", () => {
        const config = structuredClone(manchesterDashboardConfig);
        config.stationGroups[0]!.stations[0]!.crs = "not-a-station";

        const result = DashboardConfigSchema.safeParse(config);

        expect(result.success).toBe(false);
        expect(dashboardConfigErrorMessages(result.error!)).toContain(
            "Station group 1, station 1: Enter a valid CRS station code."
        );
    });

    it("accepts overlapping schedules", () => {
        const config = structuredClone(manchesterDashboardConfig);
        config.schedules.push({
            ...config.schedules[0]!,
            id: "overlapping-weekday-morning",
            name: "Overlapping weekday morning",
            startsAt: "08:00",
            endsAt: "13:00",
        });

        const result = DashboardConfigSchema.safeParse(config);

        expect(result.success).toBe(true);
    });

    it("rejects a schedule without a journey", () => {
        const config = structuredClone(manchesterDashboardConfig);
        config.schedules[0]!.journeyId = "";

        const result = DashboardConfigSchema.safeParse(config);

        expect(result.success).toBe(false);
        expect(result.error?.issues).toContainEqual(
            expect.objectContaining({
                path: ["schedules", 0, "journeyId"],
            })
        );
    });
});
