import {describe, expect, it} from "vitest";
import {DashboardConfigSchema} from "./dashboardConfig.dto";

describe("DashboardConfigSchema", () => {
    it("accepts an empty configuration", () => {
        expect(
            DashboardConfigSchema.safeParse({
                version: 3,
                stationGroups: [],
                journeys: [],
                schedules: [],
            }).success
        ).toBe(true);
    });
});
