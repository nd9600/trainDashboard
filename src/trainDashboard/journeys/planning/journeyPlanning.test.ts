import {describe, expect, it} from "vitest";
import {manchesterDashboardConfig} from "../../testing/manchesterDashboardConfig.fixture";
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
    it("prioritises travel from Heaton Chapel to Manchester Piccadilly on weekday mornings", () => {
        const activePlan = getJourneyPlan(manchesterDashboardConfig, {
            day: 1,
            minutes: 8 * 60,
        });

        expect(activePlan.schedule?.id).toBe("weekday-morning");
        expect(
            activePlan.primaryRoutes.map((route) => route.journeyId)
        ).toEqual([
            "heaton-chapel-to-manchester-piccadilly",
            "heaton-chapel-to-manchester-piccadilly",
        ]);
        expect(
            activePlan.secondaryRoutes.map((route) => route.journeyId)
        ).toEqual(["heaton-chapel-to-liverpool", "heaton-chapel-to-liverpool"]);
    });

    it("reverses weekday travel after noon", () => {
        const activePlan = getJourneyPlan(manchesterDashboardConfig, {
            day: 3,
            minutes: 12 * 60,
        });

        expect(activePlan.schedule?.id).toBe("weekday-afternoon");
        expect(
            new Set(activePlan.primaryRoutes.map((route) => route.journeyId))
        ).toEqual(new Set(["manchester-piccadilly-to-heaton-chapel"]));
        expect(
            new Set(
                activePlan.primaryRoutes.map(
                    (journeys) => journeys.destination.locationName
                )
            )
        ).toEqual(new Set(["Heaton Chapel"]));
        expect(
            new Set(activePlan.secondaryRoutes.map((route) => route.journeyId))
        ).toEqual(new Set(["liverpool-to-heaton-chapel"]));
    });

    it("uses selected stations for other journeys", () => {
        const config = structuredClone(manchesterDashboardConfig);
        config.journeys[2]!.origin = {
            type: "station",
            groupId: "heaton-chapel",
            crs: "HTC",
        };
        config.journeys[2]!.destination = {
            type: "station",
            groupId: "liverpool",
            crs: "LIV",
        };

        const activePlan = getJourneyPlan(config, {
            day: 1,
            minutes: 8 * 60,
        });

        expect(
            activePlan.secondaryRoutes.map(
                (route) => `${route.origin.crs}-${route.destination.crs}`
            )
        ).toEqual(["HTC-LIV"]);
    });

    it("includes direct and configured connecting routes", () => {
        const config = structuredClone(manchesterDashboardConfig);
        config.journeys[0]!.viaCrs = "MAN";

        const activePlan = getJourneyPlan(config, {
            day: 1,
            minutes: 8 * 60,
        });

        expect(activePlan.primaryRoutes).toHaveLength(3);
        expect(activePlan.primaryRoutes.map((route) => route.viaCrs)).toEqual([
            undefined,
            "MAN",
            undefined,
        ]);
    });

    it("ends at the connecting station when it is also a destination", () => {
        const journey = structuredClone(manchesterDashboardConfig.journeys[0]!);
        journey.origin = {
            type: "station",
            groupId: "manchester-piccadilly",
            crs: "EDY",
        };
        journey.destination = {type: "group", groupId: "heaton-chapel"};
        journey.viaCrs = "HTC";

        const routes = getStationRoutes(
            [journey],
            manchesterDashboardConfig.stationGroups
        );

        expect(
            routes.map((route) => ({
                stations: `${route.origin.crs}-${route.destination.crs}`,
                viaCrs: route.viaCrs,
            }))
        ).toEqual([
            {stations: "EDY-HTC", viaCrs: undefined},
            {stations: "EDY-BNA", viaCrs: undefined},
            {stations: "EDY-BNA", viaCrs: "HTC"},
        ]);
    });

    it("prioritises travel from Heaton Chapel to Liverpool at weekends", () => {
        const activePlan = getJourneyPlan(manchesterDashboardConfig, {
            day: 6,
            minutes: 14 * 60,
        });

        expect(activePlan.schedule?.id).toBe("weekend");
        expect(
            new Set(activePlan.primaryRoutes.map((route) => route.journeyId))
        ).toEqual(new Set(["heaton-chapel-to-liverpool"]));
        expect(activePlan.secondaryRoutes).toEqual([]);
    });

    it("preserves unknown walking times when it expands a station group", () => {
        const [journeys] = getStationRoutes(
            [manchesterDashboardConfig.journeys[2]!],
            manchesterDashboardConfig.stationGroups
        );

        expect(journeys).toMatchObject({
            origin: {
                crs: "HTC",
                walkMinutes: 15,
                locationName: "Heaton Chapel",
            },
            destination: {
                crs: "LIV",
                walkMinutes: undefined,
                locationName: "Liverpool",
            },
        });
    });

    it("uses the selected group name for an individual station", () => {
        const [journeys] = getStationRoutes(
            [manchesterDashboardConfig.journeys[0]!],
            manchesterDashboardConfig.stationGroups
        );

        expect(journeys?.origin).toMatchObject({
            crs: "HTC",
            locationName: "Heaton Chapel",
            walkMinutes: 15,
        });
    });

    it("rejects an individual station outside its selected group", () => {
        const config = structuredClone(manchesterDashboardConfig);
        const origin = config.journeys[0]!.origin;

        if (origin.type !== "station") {
            throw new Error("Expected an individual station.");
        }

        origin.crs = "EDY";

        expect(dashboardConfigSchema.safeParse(config).success).toBe(false);
    });

    it("rejects overlapping schedules", () => {
        const config = structuredClone(manchesterDashboardConfig);
        config.schedules.push({
            id: "overlap",
            name: "Overlap",
            days: [1],
            startsAt: "11:00",
            endsAt: "13:00",
            primaryJourneyId: "heaton-chapel-to-manchester-piccadilly",
            secondaryJourneyIds: [],
        });

        expect(dashboardConfigSchema.safeParse(config).success).toBe(false);
    });

    it("rejects an invalid schedule time", () => {
        const config = structuredClone(manchesterDashboardConfig);
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
