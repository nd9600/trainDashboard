import {describe, expect, it} from "vitest";
import type {Journey, StationGroup} from "../dto/dashboardConfig.dto";
import type {TimetabledJourney} from "../dto/timetabledJourney.dto";
import type {JourneyRoute} from "./planning/journeyRoutes";
import {
    getJourneyLabelDetails,
    getJourneyLabelText,
    getRouteLabelDetails,
    getTimetabledJourneyLabelDetails,
} from "./journeyLabels";

const stationGroups: StationGroup[] = [
    {
        id: "home",
        name: "Home",
        stations: [{crs: "ANL"}, {crs: "KVD"}],
    },
    {
        id: "work",
        name: "Work",
        stations: [{crs: "CHC"}, {crs: "EXG"}],
    },
    {
        id: "wendys",
        name: "Wendy's",
        stations: [{crs: "EDB"}],
    },
];

describe("getJourneyLabelDetails", () => {
    it("includes selected stations for groups with several stations", () => {
        const journey: Journey = {
            id: "home-to-work",
            origin: {type: "station", groupId: "home", crs: "KVD"},
            destination: {type: "station", groupId: "work", crs: "CHC"},
        };

        expect(getJourneyLabelDetails(journey, stationGroups)).toEqual({
            origin: {name: "Home", stationCrs: "KVD"},
            destination: {name: "Work", stationCrs: "CHC"},
            connectingStationCrs: undefined,
        });
    });

    it("omits a selected station for a group with one station", () => {
        const journey: Journey = {
            id: "home-to-wendys",
            origin: {type: "group", groupId: "home"},
            destination: {type: "station", groupId: "wendys", crs: "EDB"},
            viaCrs: "GLQ",
        };

        expect(getJourneyLabelDetails(journey, stationGroups)).toEqual({
            origin: {name: "Home", stationCrs: undefined},
            destination: {name: "Wendy's", stationCrs: undefined},
            connectingStationCrs: "GLQ",
        });
    });
});

describe("getRouteLabelDetails", () => {
    it("uses group names and the configured connecting station", () => {
        const route: JourneyRoute = {
            id: "home-to-wendys:KVD-EDB",
            journeyId: "home-to-wendys",
            origin: {crs: "KVD", locationName: "Home"},
            destination: {crs: "EDB", locationName: "Wendy's"},
            viaCrs: "GLQ",
        };

        expect(getRouteLabelDetails(route)).toEqual({
            origin: {name: "Home"},
            destination: {name: "Wendy's"},
            connectingStationCrs: "GLQ",
        });
    });
});

describe("getTimetabledJourneyLabelDetails", () => {
    it("gets the connecting station from a journey with two train legs", () => {
        const journey = getTimetabledJourney([
            {
                origin: "KVD",
                destination: "GLQ",
                departure: 600,
                arrival: 620,
            },
            {
                origin: "GLQ",
                destination: "EDB",
                departure: 630,
                arrival: 680,
            },
        ]);

        expect(getTimetabledJourneyLabelDetails(journey)).toEqual({
            origin: {name: "Home"},
            destination: {name: "Wendy's"},
            connectingStationCrs: "GLQ",
        });
    });

    it("does not treat the destination of a direct train as a connection", () => {
        const journey = getTimetabledJourney([
            {
                origin: "KVD",
                destination: "EDB",
                departure: 600,
                arrival: 680,
            },
        ]);

        expect(getTimetabledJourneyLabelDetails(journey)).toEqual({
            origin: {name: "Home"},
            destination: {name: "Wendy's"},
            connectingStationCrs: undefined,
        });
    });
});

describe("getJourneyLabelText", () => {
    it("uses the agreed endpoint and connection wording without CRS codes", () => {
        expect(
            getJourneyLabelText({
                origin: {name: "Home", stationCrs: "KVD"},
                destination: {name: "Work", stationCrs: "CHC"},
                connectingStationCrs: "GLQ",
            })
        ).toBe(
            "Home, through Kelvindale → Work, arriving at Charing Cross (Glasgow), connecting through Glasgow Queen Street"
        );
    });
});

function getTimetabledJourney(
    trainLegs: TimetabledJourney["trainLegs"]
): TimetabledJourney {
    return {
        id: "home-to-wendys:KVD-EDB:600",
        journeyId: "home-to-wendys",
        origin: "KVD",
        originLocationName: "Home",
        destination: "EDB",
        destinationLocationName: "Wendy's",
        railArrivalTime: "11:20",
        walkingTimesKnown: true,
        segments: trainLegs.map((leg) => ({
            kind: "train",
            start: leg.departure,
            end: leg.arrival,
        })),
        trainLegs,
    };
}
