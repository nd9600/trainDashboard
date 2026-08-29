import {describe, expect, it} from "vitest";
import {manchesterDashboardConfig} from "../../testing/manchesterDashboardConfig.fixture";
import {
    DashboardConfigSchema,
    TimeSchema,
    type DashboardConfig,
} from "../../dto/dashboardConfig.dto";
import {type CurrentClock, getJourneyPrediction} from "../journeyPrediction";
import {getStationRoutes} from "./journeyRoutes";
import {createEphemeralJourney} from "../../dto/journeySelection.dto";

describe("journey planning", () => {
    it("selects travel from Heaton Chapel to Manchester Piccadilly on weekday mornings", () => {
        const activePlan = getJourneyPlan(manchesterDashboardConfig, {
            day: 1,
            minutes: 8 * 60,
        });

        expect(activePlan.schedule?.id).toBe("weekday-morning");
        expect(activePlan.routes.map((route) => route.journeyId)).toEqual([
            "heaton-chapel-to-manchester-piccadilly",
            "heaton-chapel-to-manchester-piccadilly",
        ]);
    });

    it("reverses weekday travel after noon", () => {
        const activePlan = getJourneyPlan(manchesterDashboardConfig, {
            day: 3,
            minutes: 12 * 60,
        });

        expect(activePlan.schedule?.id).toBe("weekday-afternoon");
        expect(
            new Set(activePlan.routes.map((route) => route.journeyId))
        ).toEqual(new Set(["manchester-piccadilly-to-heaton-chapel"]));
        expect(
            new Set(
                activePlan.routes.map(
                    (journeys) => journeys.destination.locationName
                )
            )
        ).toEqual(new Set(["Heaton Chapel"]));
    });

    it("uses selected stations for the scheduled journey", () => {
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
            day: 6,
            minutes: 14 * 60,
        });

        expect(
            activePlan.routes.map(
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

        expect(activePlan.routes).toHaveLength(3);
        expect(activePlan.routes.map((route) => route.viaCrs)).toEqual([
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

    it("selects travel from Heaton Chapel to Liverpool at weekends", () => {
        const activePlan = getJourneyPlan(manchesterDashboardConfig, {
            day: 6,
            minutes: 14 * 60,
        });

        expect(activePlan.schedule?.id).toBe("weekend");
        expect(
            new Set(activePlan.routes.map((route) => route.journeyId))
        ).toEqual(new Set(["heaton-chapel-to-liverpool"]));
    });

    it("leaves walking time unknown for a station-to-station journey", () => {
        const journey = createEphemeralJourney({
            origin: {type: "station", crs: "MAN"},
            destination: {type: "station", crs: "LIV"},
        })!;

        const [route] = getStationRoutes(
            [journey],
            manchesterDashboardConfig.stationGroups
        );

        expect(route).toMatchObject({
            origin: {crs: "MAN"},
            destination: {crs: "LIV"},
        });
        expect(route!.origin).not.toHaveProperty("walkMinutes");
        expect(route!.destination).not.toHaveProperty("walkMinutes");
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

        expect(DashboardConfigSchema.safeParse(config).success).toBe(false);
    });

    it("rejects overlapping schedules", () => {
        const config = structuredClone(manchesterDashboardConfig);
        config.schedules.push({
            id: "overlap",
            name: "Overlap",
            days: [1],
            startsAt: "11:00",
            endsAt: "13:00",
            journeyId: "heaton-chapel-to-manchester-piccadilly",
        });

        expect(DashboardConfigSchema.safeParse(config).success).toBe(false);
    });

    it("rejects an invalid schedule time", () => {
        const config = structuredClone(manchesterDashboardConfig);
        config.schedules[0]!.startsAt = "a1:22";

        expect(DashboardConfigSchema.safeParse(config).success).toBe(false);
    });

    it.each(["00:00", "23:59", "24:00"])(
        "accepts the supported time %s",
        (time) => {
            expect(TimeSchema.safeParse(time).success).toBe(true);
        }
    );
});

function getJourneyPlan(config: DashboardConfig, currentClock: CurrentClock) {
    const prediction = getJourneyPrediction(config.schedules, currentClock);
    const configuredJourney = config.journeys.find(
        (journey) => journey.id === prediction.predictedJourneyId
    );

    return {
        schedule: prediction.activeSchedule,
        routes: getStationRoutes(
            configuredJourney ? [configuredJourney] : [],
            config.stationGroups
        ),
    };
}
