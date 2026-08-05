import {describe, expect, it} from "vitest";
import {defaultDashboardConfig} from "../../config/defaultDashboardConfig";
import {
    dashboardConfigSchema,
    timeSchema,
    type DashboardConfig,
} from "../../dto/dashboardConfig.dto";
import {
    getActiveSchedule,
    type CurrentClock,
    getJourneysForSchedule,
} from "./journeySelection";
import {getStationRoutes} from "./journeyRoutes";

describe("journey planning", () => {
    it("prioritises travel from home to work on weekday mornings", () => {
        const activePlan = getJourneyPlan(defaultDashboardConfig, {
            day: 1,
            minutes: 8 * 60,
        });

        expect(activePlan.schedule?.id).toBe("weekday-morning");
        expect(
            activePlan.primaryRoutes.map((route) => route.journeyId)
        ).toEqual(["home-to-work", "home-to-work"]);
        expect(
            activePlan.secondaryRoutes.map((route) => route.journeyId)
        ).toEqual([
            "home-to-glasgow",
            "home-to-glasgow",
            "home-to-glasgow",
            "home-to-glasgow",
        ]);
    });

    it("reverses weekday travel after noon", () => {
        const activePlan = getJourneyPlan(defaultDashboardConfig, {
            day: 3,
            minutes: 12 * 60,
        });

        expect(activePlan.schedule?.id).toBe("weekday-afternoon");
        expect(
            new Set(activePlan.primaryRoutes.map((route) => route.journeyId))
        ).toEqual(new Set(["work-to-home"]));
        expect(
            new Set(
                activePlan.primaryRoutes.map(
                    (journeys) => journeys.destination.locationName
                )
            )
        ).toEqual(new Set(["Home"]));
        expect(
            new Set(activePlan.secondaryRoutes.map((route) => route.journeyId))
        ).toEqual(new Set(["glasgow-to-home"]));
    });

    it("uses selected stations for other journeys", () => {
        const config = structuredClone(defaultDashboardConfig);
        config.journeys[2]!.origin = {
            type: "station",
            groupId: "home",
            crs: "ANL",
        };
        config.journeys[2]!.destination = {
            type: "station",
            groupId: "glasgow",
            crs: "GLQ",
        };

        const activePlan = getJourneyPlan(config, {
            day: 1,
            minutes: 8 * 60,
        });

        expect(
            activePlan.secondaryRoutes.map(
                (route) => `${route.origin.crs}-${route.destination.crs}`
            )
        ).toEqual(["ANL-GLQ"]);
    });

    it("includes direct and configured connecting routes", () => {
        const config = structuredClone(defaultDashboardConfig);
        config.journeys[0]!.viaCrs = "GLQ";

        const activePlan = getJourneyPlan(config, {
            day: 1,
            minutes: 8 * 60,
        });

        expect(activePlan.primaryRoutes).toHaveLength(4);
        expect(activePlan.primaryRoutes.map((route) => route.viaCrs)).toEqual([
            undefined,
            "GLQ",
            undefined,
            "GLQ",
        ]);
    });

    it("ends at the connecting station when it is also a destination", () => {
        const journey = structuredClone(defaultDashboardConfig.journeys[0]!);
        journey.origin = {
            type: "station",
            groupId: "work",
            crs: "CHC",
        };
        journey.destination = {type: "group", groupId: "home"};
        journey.viaCrs = "ANL";

        const routes = getStationRoutes(
            [journey],
            defaultDashboardConfig.stationGroups
        );

        expect(
            routes.map((route) => ({
                stations: `${route.origin.crs}-${route.destination.crs}`,
                viaCrs: route.viaCrs,
            }))
        ).toEqual([
            {stations: "CHC-ANL", viaCrs: undefined},
            {stations: "CHC-KVD", viaCrs: undefined},
            {stations: "CHC-KVD", viaCrs: "ANL"},
        ]);
    });

    it("prioritises travel from home to Glasgow at weekends", () => {
        const activePlan = getJourneyPlan(defaultDashboardConfig, {
            day: 6,
            minutes: 14 * 60,
        });

        expect(activePlan.schedule?.id).toBe("weekend");
        expect(
            new Set(activePlan.primaryRoutes.map((route) => route.journeyId))
        ).toEqual(new Set(["home-to-glasgow"]));
        expect(activePlan.secondaryRoutes).toEqual([]);
    });

    it("preserves unknown walking times when it expands a station group", () => {
        const [journeys] = getStationRoutes(
            [defaultDashboardConfig.journeys[2]!],
            defaultDashboardConfig.stationGroups
        );

        expect(journeys).toMatchObject({
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
        const [journeys] = getStationRoutes(
            [defaultDashboardConfig.journeys[0]!],
            defaultDashboardConfig.stationGroups
        );

        expect(journeys?.origin).toMatchObject({
            crs: "ANL",
            locationName: "Home",
            walkMinutes: 15,
        });
    });

    it("rejects an individual station outside its selected group", () => {
        const config = structuredClone(defaultDashboardConfig);
        const origin = config.journeys[0]!.origin;

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
            primaryJourneyId: "home-to-work",
            secondaryJourneyIds: [],
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

function getJourneyPlan(config: DashboardConfig, currentClock: CurrentClock) {
    const schedule = getActiveSchedule(config.schedules, currentClock);
    const configuredJourneys = getJourneysForSchedule(
        config.journeys,
        schedule
    );

    return {
        schedule,
        primaryRoutes: getStationRoutes(
            configuredJourneys.primaryJourneys,
            config.stationGroups
        ),
        secondaryRoutes: getStationRoutes(
            configuredJourneys.secondaryJourneys,
            config.stationGroups
        ),
    };
}
