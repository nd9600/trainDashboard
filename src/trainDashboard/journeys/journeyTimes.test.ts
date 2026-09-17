import {describe, expect, it} from "vitest";
import type {TimetabledJourney} from "../dto/timetabledJourney.dto";
import {getJourneyTimelineRange, getTimelineTicks} from "./journeyTimes";

describe("getJourneyTimelineRange", () => {
    it("covers the earliest segment start and latest segment end", () => {
        const journey: TimetabledJourney = {
            id: "connected",
            journeyId: "heaton-chapel-to-liverpool",
            origin: "BNA",
            originLocationName: "Heaton Chapel",
            destination: "LIV",
            destinationLocationName: "Liverpool",
            railArrivalTime: "18:00",
            walkingTimesKnown: true,
            segments: [
                {kind: "walk", start: 15 * 60, end: 15 * 60 + 5},
                {kind: "train", start: 15 * 60 + 5, end: 15 * 60 + 20},
                {kind: "wait", start: 15 * 60 + 20, end: 15 * 60 + 30},
                {kind: "train", start: 15 * 60 + 30, end: 18 * 60},
            ],
            trainLegs: [
                {
                    serviceId: "first-train",
                    origin: "BNA",
                    destination: "MAN",
                    departure: 15 * 60 + 5,
                    arrival: 15 * 60 + 20,
                },
                {
                    serviceId: "second-train",
                    origin: "MAN",
                    destination: "LIV",
                    departure: 15 * 60 + 30,
                    arrival: 18 * 60,
                },
            ],
        };

        expect(getJourneyTimelineRange([journey], 15 * 60 + 2)).toEqual({
            start: 15 * 60 - 5,
            end: 18 * 60 + 10,
        });
    });
});

it.each([
    [595, 685, [600, 615, 630, 645, 660, 675]],
    [1435, 1490, [1440, 1450, 1460, 1470, 1480, 1490]],
    [0, 15, [0, 2, 4, 6, 8, 10, 12, 14]],
])("uses whole-minute ticks between %i and %i", (start, end, expected) => {
    expect(getTimelineTicks(start, end)).toEqual(expected);
});
