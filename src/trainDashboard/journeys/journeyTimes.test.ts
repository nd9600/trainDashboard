import {describe, expect, it} from "vitest";
import type {TimetabledJourney} from "../dto/timetabledJourney.dto";
import {getJourneyTimelineRange} from "./journeyTimes";

describe("getJourneyTimelineRange", () => {
    it("covers the earliest segment start and latest segment end", () => {
        const journey: TimetabledJourney = {
            id: "connected",
            origin: "KVD",
            destination: "EDB",
            contextLabel: "Home to Wendy's",
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
                    origin: "KVD",
                    destination: "GLQ",
                    departure: 15 * 60 + 5,
                    arrival: 15 * 60 + 20,
                },
                {
                    origin: "GLQ",
                    destination: "EDB",
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
