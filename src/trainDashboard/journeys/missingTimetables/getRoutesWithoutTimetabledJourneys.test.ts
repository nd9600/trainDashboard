import {describe, expect, it} from "vitest";
import type {TimetabledJourney} from "../../dto/timetabledJourney.dto";
import type {JourneyRoute} from "../planning/journeyRoutes";
import {getRoutesWithoutTimetabledJourneys} from "./getRoutesWithoutTimetabledJourneys";

describe("getRoutesWithoutTimetabledJourneys", () => {
    it("returns each journey route that has no loaded journey", () => {
        const routes = [journeyRoute("HTC", "LIV"), journeyRoute("BNA", "LIV")];
        const timetabledJourneys = [journey("HTC", "LIV")];

        expect(
            getRoutesWithoutTimetabledJourneys(routes, timetabledJourneys)
        ).toEqual([routes[1]]);
    });

    it("returns one missing route for direct and connected options with the same endpoints", () => {
        const directRoute = journeyRoute("EDY", "BNA");
        const connectedRoute = {
            ...journeyRoute("EDY", "BNA"),
            id: "manchester-piccadilly-to-heaton-chapel:EDY-BNA:via-MAN",
            viaCrs: "MAN",
        };

        expect(
            getRoutesWithoutTimetabledJourneys(
                [directRoute, connectedRoute],
                []
            )
        ).toEqual([directRoute]);
    });
});

function journeyRoute(origin: string, destination: string): JourneyRoute {
    return {
        id: `heaton-chapel-to-liverpool:${origin}-${destination}`,
        journeyId: "heaton-chapel-to-liverpool",
        origin: {crs: origin, locationName: "Heaton Chapel"},
        destination: {crs: destination, locationName: "Liverpool"},
    };
}

function journey(origin: string, destination: string): TimetabledJourney {
    return {
        id: `${origin}-${destination}:1700`,
        journeyId: "heaton-chapel-to-liverpool",
        origin,
        originLocationName: "Heaton Chapel",
        destination,
        destinationLocationName: "Liverpool",
        railArrivalTime: "18:00",
        walkingTimesKnown: false,
        segments: [{kind: "train", start: 17 * 60, end: 18 * 60}],
        trainLegs: [
            {
                origin,
                destination,
                departure: 17 * 60,
                arrival: 18 * 60,
            },
        ],
    };
}
