import {describe, expect, it} from "vitest";
import type {TimetabledJourney} from "../dto/timetabledJourney.dto";
import type {JourneyRoute} from "./getCurrentJourneyPriorities";
import {getRoutesWithoutTimetabledJourneys} from "./getRoutesWithoutTimetabledJourneys";

describe("getRoutesWithoutTimetabledJourneys", () => {
    it("returns each journey route that has no loaded journey", () => {
        const routes = [journeyRoute("ANL", "EDB"), journeyRoute("KVD", "EDB")];
        const timetabledJourneys = [journey("ANL", "EDB")];

        expect(
            getRoutesWithoutTimetabledJourneys(routes, timetabledJourneys)
        ).toEqual([routes[1]]);
    });
});

function journeyRoute(origin: string, destination: string): JourneyRoute {
    return {
        id: `home-to-wendys:${origin}-${destination}`,
        journeyId: "home-to-wendys",
        contextLabel: "Home to Wendy's",
        origin: {crs: origin, locationName: "Home"},
        destination: {crs: destination, locationName: "Wendy's"},
    };
}

function journey(origin: string, destination: string): TimetabledJourney {
    return {
        id: `${origin}-${destination}:1700`,
        origin,
        destination,
        contextLabel: "Home to Wendy's",
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
