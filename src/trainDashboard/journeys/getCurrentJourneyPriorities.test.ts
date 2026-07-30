import {describe, expect, it} from "vitest";
import {defaultDashboardConfig} from "../config/defaultDashboardConfig";
import {dashboardConfigSchema, timeSchema} from "../dto/dashboardConfig.dto";
import {
    expandStationPairs,
    getCurrentJourneyPriorities,
} from "./getCurrentJourneyPriorities";

describe("getCurrentJourneyPriorities", () => {
    it("prioritises travel from home to work on weekday mornings", () => {
        const resolved = getCurrentJourneyPriorities(defaultDashboardConfig, {
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
        const resolved = getCurrentJourneyPriorities(defaultDashboardConfig, {
            day: 3,
            minutes: 12 * 60,
        });

        expect(resolved.schedule?.id).toBe("weekday-afternoon");
        expect(
            new Set(resolved.primaryPairs.map((pair) => pair.pairId))
        ).toEqual(new Set(["work-to-home"]));
        expect(
            new Set(
                resolved.primaryPairs.map(
                    (pair) => pair.destination.locationName
                )
            )
        ).toEqual(new Set(["Home"]));
        expect(
            new Set(resolved.secondaryPairs.map((pair) => pair.pairId))
        ).toEqual(new Set(["glasgow-to-home"]));
    });

    it("uses selected stations for other journeys", () => {
        const config = structuredClone(defaultDashboardConfig);
        config.pairs[2]!.origin = {
            type: "station",
            groupId: "home",
            crs: "ANL",
        };
        config.pairs[2]!.destination = {
            type: "station",
            groupId: "glasgow",
            crs: "GLQ",
        };

        const resolved = getCurrentJourneyPriorities(config, {
            day: 1,
            minutes: 8 * 60,
        });

        expect(
            resolved.secondaryPairs.map(
                (pair) => `${pair.origin.crs}-${pair.destination.crs}`
            )
        ).toEqual(["ANL-GLQ"]);
    });

    it("preserves the configured route name on resolved pairs", () => {
        const config = structuredClone(defaultDashboardConfig);
        config.pairs[0]!.viaCrs = "GLQ";

        const resolved = getCurrentJourneyPriorities(config, {
            day: 1,
            minutes: 8 * 60,
        });

        expect(resolved.primaryPairs).toHaveLength(2);
        expect(resolved.primaryPairs.map((pair) => pair.viaCrs)).toEqual([
            "GLQ",
            "GLQ",
        ]);
        expect(resolved.primaryPairs[0]?.contextLabel).toBe(
            "Home, through Anniesland (ANL) → Work, changing at Glasgow Queen Street (GLQ)"
        );
    });

    it("prioritises travel from home to Glasgow at weekends", () => {
        const resolved = getCurrentJourneyPriorities(defaultDashboardConfig, {
            day: 6,
            minutes: 14 * 60,
        });

        expect(resolved.schedule?.id).toBe("weekend");
        expect(
            new Set(resolved.primaryPairs.map((pair) => pair.pairId))
        ).toEqual(new Set(["home-to-glasgow"]));
        expect(resolved.secondaryPairs).toEqual([]);
    });

    it("preserves unknown walking times when it expands a station group", () => {
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
                walkMinutes: undefined,
                locationName: "Glasgow",
            },
        });
    });

    it("uses the selected group name for an individual station", () => {
        const [pair] = expandStationPairs(
            [defaultDashboardConfig.pairs[0]!],
            defaultDashboardConfig.groups
        );

        expect(pair?.origin).toMatchObject({
            crs: "ANL",
            locationName: "Home",
            walkMinutes: 15,
        });
    });

    it("rejects an individual station outside its selected group", () => {
        const config = structuredClone(defaultDashboardConfig);
        const origin = config.pairs[0]!.origin;

        if (origin.type !== "station") {
            throw new Error("Expected an individual station.");
        }

        origin.crs = "CHC";

        expect(dashboardConfigSchema.safeParse(config).success).toBe(false);
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

    it("rejects an invalid schedule time", () => {
        const config = structuredClone(defaultDashboardConfig);
        config.schedules[0]!.startsAt = "a1:22";

        expect(dashboardConfigSchema.safeParse(config).success).toBe(false);
    });

    it.each(["00:00", "23:59", "24:00"])(
        "accepts the supported time %s",
        (time) => {
            expect(timeSchema.safeParse(time).success).toBe(true);
        }
    );
});
