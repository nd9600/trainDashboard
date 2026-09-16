import {describe, expect, it} from "vitest";
import {DashboardConfigSchema} from "./dashboardConfig.dto";

describe("DashboardConfigSchema", () => {
    it("enables location by default for an existing configuration", () => {
        expect(
            DashboardConfigSchema.parse({
                version: 3,
                stationGroups: [],
                journeys: [],
                schedules: [],
            }).shouldUseLocation
        ).toBe(true);
    });
});
