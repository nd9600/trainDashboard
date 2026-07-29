import {describe, expect, it} from "vitest";
import {defaultDashboardConfig} from "./defaultDashboardConfig";
import {dashboardConfigSchema} from "./dashboardConfig";
import {
    expandStationPairs,
    resolveDashboardConfig,
} from "./resolveDashboardConfig";

describe("resolveDashboardConfig", () => {
    it("prioritises travel from home to work on weekday mornings", () => {
        const resolved = resolveDashboardConfig(defaultDashboardConfig, {
            day: 1,
            minutes: 8 * 60,
        });

        expect(resolved.schedule?.id).toBe("weekday-morning");
        expect(resolved.primaryPairs.map((pair) => pair.pairId)).toEqual([
            "home-to-work",
            "home-to-work",
        ]);
        expect(resolved.secondaryPairs.map((pair) => pair.pairId)).toEqual([
            "home-to-glasgow",
            "home-to-glasgow",
            "home-to-glasgow",
            "home-to-glasgow",
        ]);
    });

    it("reverses weekday travel after noon", () => {
        const resolved = resolveDashboardConfig(defaultDashboardConfig, {
            day: 3,
            minutes: 12 * 60,
        });

        expect(resolved.schedule?.id).toBe("weekday-afternoon");
        expect(
            new Set(resolved.primaryPairs.map((pair) => pair.pairId))
        ).toEqual(new Set(["work-to-home"]));
        expect(
            new Set(resolved.secondaryPairs.map((pair) => pair.pairId))
        ).toEqual(new Set(["glasgow-to-home"]));
    });

    it("prioritises travel from home to Glasgow at weekends", () => {
        const resolved = resolveDashboardConfig(defaultDashboardConfig, {
            day: 6,
            minutes: 14 * 60,
        });

        expect(resolved.schedule?.id).toBe("weekend");
        expect(
            new Set(resolved.primaryPairs.map((pair) => pair.pairId))
        ).toEqual(new Set(["home-to-glasgow"]));
        expect(resolved.secondaryPairs).toEqual([]);
    });

    it("keeps walking times when it expands a station group", () => {
        const [pair] = expandStationPairs(
            [defaultDashboardConfig.pairs[2]!],
            defaultDashboardConfig.groups
        );

        expect(pair).toMatchObject({
            origin: {
                crs: "ANL",
                walkMinutes: 15,
                locationName: "Home",
            },
            destination: {
                crs: "GLQ",
                walkMinutes: 0,
                locationName: "Glasgow",
            },
        });
    });

    it("rejects overlapping schedules", () => {
        const config = structuredClone(defaultDashboardConfig);
        config.schedules.push({
            id: "overlap",
            name: "Overlap",
            days: [1],
            startsAt: "11:00",
            endsAt: "13:00",
            primaryPairIds: ["home-to-work"],
            secondaryPairIds: [],
        });

        expect(dashboardConfigSchema.safeParse(config).success).toBe(false);
    });
});
