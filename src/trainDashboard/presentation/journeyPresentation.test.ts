import {describe, expect, it} from "vitest";
import type {TimetabledJourney} from "../dto/timetabledJourney.dto";
import {
    getTimelineRange,
    nationalRailJourneyUrl,
    buildNationalRailUrl,
} from "./journeyPresentation";

describe("nationalRailJourneyUrl", () => {
    it("links to the journey departure on National Rail Enquiries", () => {
        const journey: TimetabledJourney = {
            id: "work-to-home:CHC-ANL:1700",
            origin: "CHC",
            destination: "ANL",
            contextLabel: "Work to Home",
            railArrivalTime: "17:18",
            walkingTimesKnown: false,
            segments: [
                {kind: "walk", start: 16 * 60 + 52, end: 17 * 60},
                {kind: "train", start: 17 * 60, end: 17 * 60 + 18},
            ],
            trainLegs: [
                {
                    origin: "CHC",
                    destination: "ANL",
                    departure: 17 * 60,
                    arrival: 17 * 60 + 18,
                },
            ],
        };

        expect(nationalRailJourneyUrl(journey)).toBe(
            "https://ojp.nationalrail.co.uk/service/timesandfares/CHC/ANL/today/1700/dep"
        );
    });

    it("links a route without timetable data from the requested time", () => {
        expect(buildNationalRailUrl("ANL", "EDB", 17 * 60)).toBe(
            "https://ojp.nationalrail.co.uk/service/timesandfares/ANL/EDB/today/1700/dep"
        );
    });

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

        expect(getTimelineRange([journey], 15 * 60 + 2)).toEqual({
            start: 15 * 60 - 5,
            end: 18 * 60 + 10,
        });
    });
});
