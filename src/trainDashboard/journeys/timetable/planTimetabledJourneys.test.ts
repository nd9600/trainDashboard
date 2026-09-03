import {describe, expect, it} from "vitest";
import type {TrainLeg} from "../../dto/timetabledJourney.dto";
import type {JourneyRoute} from "../planning/journeyRoutes";
import type {RouteTimetable} from "./loadRouteTimetables";
import {planTimetabledJourneys} from "./planTimetabledJourneys";

describe("planTimetabledJourneys", () => {
    it("plans a connected journey and keeps the slower options as alternatives", () => {
        // Now 10:00. Walk 5 minutes to the station.
        // First: A 10:10-10:30, B 10:20-10:35.
        // Onward: C 10:40-11:20, D 10:45-11:15.
        const routeTimetable: RouteTimetable = {
            route: connectedRoute,
            firstTrainLegs: [
                trainLeg("A", "HTC", "MAN", 10 * 60 + 10, 10 * 60 + 30),
                trainLeg("B", "HTC", "MAN", 10 * 60 + 20, 10 * 60 + 35),
            ],
            onwardTrainLegs: [
                trainLeg("C", "MAN", "LIV", 10 * 60 + 40, 11 * 60 + 20),
                trainLeg("D", "MAN", "LIV", 10 * 60 + 45, 11 * 60 + 15),
            ],
        };

        const journeys = planTimetabledJourneys([routeTimetable], 10 * 60);

        expect(journeys).toHaveLength(1);
        expect(journeys[0]).toMatchObject({
            recommended: true,
            arrivalTime: "11:25",
            segments: [
                {kind: "walk", start: 10 * 60 + 15, end: 10 * 60 + 20},
                {kind: "train", start: 10 * 60 + 20, end: 10 * 60 + 35},
                {kind: "wait", start: 10 * 60 + 35, end: 10 * 60 + 45},
                {kind: "train", start: 10 * 60 + 45, end: 11 * 60 + 15},
                {kind: "walk", start: 11 * 60 + 15, end: 11 * 60 + 25},
            ],
            trainLegs: [
                {
                    serviceId: "B",
                    alternativeTrainLegs: [
                        expect.objectContaining({serviceId: "A"}),
                    ],
                },
                {
                    serviceId: "D",
                    alternativeTrainLegs: [
                        expect.objectContaining({serviceId: "C"}),
                    ],
                },
            ],
        });
    });
});

const connectedRoute: JourneyRoute = {
    id: "home-to-liverpool:HTC-LIV:MAN",
    journeyId: "home-to-liverpool",
    origin: {
        crs: "HTC",
        walkMinutes: 5,
        locationName: "Home",
    },
    destination: {
        crs: "LIV",
        walkMinutes: 10,
        locationName: "Liverpool",
    },
    viaCrs: "MAN",
};

function trainLeg(
    serviceId: string,
    origin: string,
    destination: string,
    departure: number,
    arrival: number
): TrainLeg {
    return {serviceId, origin, destination, departure, arrival};
}
