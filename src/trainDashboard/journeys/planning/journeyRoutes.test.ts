import {describe, expect, it} from "vitest";
import type {Journey} from "../../dto/dashboardConfig.dto";
import {manchesterDashboardConfig} from "../../testing/manchesterDashboardConfig.fixture";
import {getStationRoutes} from "./journeyRoutes";

describe("getStationRoutes", () => {
    it("expands groups into station routes with their walking times", () => {
        const routes = getStationRoutes(
            manchesterDashboardConfig.journeys[2],
            manchesterDashboardConfig.stationGroups
        );

        expect(
            routes.map(({origin, destination}) => ({origin, destination}))
        ).toEqual([
            {
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
            },
            {
                origin: {
                    crs: "BNA",
                    walkMinutes: 5,
                    locationName: "Heaton Chapel",
                },
                destination: {
                    crs: "LIV",
                    walkMinutes: undefined,
                    locationName: "Liverpool",
                },
            },
        ]);
    });

    it("uses one selected station from a group", () => {
        const routes = getStationRoutes(
            manchesterDashboardConfig.journeys[0],
            manchesterDashboardConfig.stationGroups
        );

        expect(
            routes.map(
                ({origin, destination}) =>
                    `${origin.locationName}:${origin.crs}-${destination.crs}`
            )
        ).toEqual(["Heaton Chapel:HTC-EDY", "Heaton Chapel:HTC-MAN"]);
    });

    it("leaves walking times unknown for independent stations", () => {
        const journey: Journey = {
            id: "man-to-liv",
            origin: {type: "station", crs: "MAN"},
            destination: {type: "station", crs: "LIV"},
        };

        const [route] = getStationRoutes(
            journey,
            manchesterDashboardConfig.stationGroups
        );

        expect(route).toMatchObject({
            origin: {crs: "MAN", locationName: "Manchester Piccadilly"},
            destination: {crs: "LIV", locationName: "Liverpool Lime Street"},
        });
        expect(route!.origin).not.toHaveProperty("walkMinutes");
        expect(route!.destination).not.toHaveProperty("walkMinutes");
    });

    it("adds a direct option unless the connecting station is an endpoint", () => {
        const journey: Journey = {
            id: "journey",
            origin: {type: "station", crs: "EDY"},
            destination: {type: "group", groupId: "heaton-chapel"},
            viaCrs: "HTC",
        };

        const routes = getStationRoutes(
            journey,
            manchesterDashboardConfig.stationGroups
        );

        expect(
            routes.map((route) => [
                `${route.origin.crs}-${route.destination.crs}`,
                route.viaCrs,
            ])
        ).toEqual([
            ["EDY-HTC", undefined],
            ["EDY-BNA", undefined],
            ["EDY-BNA", "HTC"],
        ]);
    });
});
