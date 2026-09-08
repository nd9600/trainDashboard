import {describe, expect, it} from "vitest";
import {getDirectTrainLegs} from "./trainLegs";
import {planTimetabledJourneys} from "./planTimetabledJourneys";

describe("delayed departures", () => {
    it.each([
        ["10:14", "10:17", "10:26", 596, 614, 617],
        ["23:58", "00:03", "00:12", 1430, 1438, 1443],
        ["10:14", "On time", "10:23", 596, 614, 614],
    ])(
        "preserves %s and plans with %s",
        (std, etd, arrival, now, scheduled, expected) => {
            const legs = getDirectTrainLegs(
                {
                    crs: "ANL",
                    trainServices: [
                        {
                            serviceID: "8530545ANSL____",
                            std,
                            etd,
                            subsequentCallingPoints: [
                                {callingPoint: [{crs: "CHC", st: arrival}]},
                            ],
                        },
                    ],
                },
                "ANL",
                "CHC",
                now
            );
            expect(legs[0]).toMatchObject({
                scheduledDeparture: scheduled,
                departure: expected,
            });
            const journeys = planTimetabledJourneys(
                [
                    {
                        route: {
                            id: "anl-chc",
                            journeyId: "anl-chc",
                            origin: {
                                crs: "ANL",
                                locationName: "Home",
                                walkMinutes: 5,
                            },
                            destination: {
                                crs: "CHC",
                                locationName: "Work",
                                walkMinutes: 0,
                            },
                        },
                        firstTrainLegs: legs,
                    },
                ],
                now
            );
            expect(journeys[0]?.segments.slice(0, 2)).toMatchObject([
                {kind: "walk", start: expected - 5, end: expected},
                {kind: "train", start: expected},
            ]);
        }
    );
});
