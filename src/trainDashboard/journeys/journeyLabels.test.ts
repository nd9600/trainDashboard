import {describe, expect, it} from "vitest";
import type {Journey, StationGroup} from "../dto/dashboardConfig.dto";
import type {TimetabledJourney} from "../dto/timetabledJourney.dto";
import type {JourneyRoute} from "./planning/journeyRoutes";
import {
    getJourneyLabelDetails,
    getJourneyLabelText,
    getRouteLabelDetails,
    getStationRouteLabelDetails,
    getTimetabledJourneyLabelDetails,
} from "./journeyLabels";

const stationGroups: StationGroup[] = [
    {
        id: "heaton-chapel",
        name: "Heaton Chapel",
        stations: [{crs: "HTC"}, {crs: "BNA"}],
    },
    {
        id: "manchester-piccadilly",
        name: "Manchester Piccadilly",
        stations: [{crs: "EDY"}, {crs: "MAN"}],
    },
    {
        id: "liverpool",
        name: "Liverpool",
        stations: [{crs: "LIV"}],
    },
];

describe("getJourneyLabelDetails", () => {
    it("includes selected stations for groups with several stations", () => {
        const journey: Journey = {
            id: "heaton-chapel-to-manchester-piccadilly",
            origin: {type: "station", groupId: "heaton-chapel", crs: "BNA"},
            destination: {
                type: "station",
                groupId: "manchester-piccadilly",
                crs: "EDY",
            },
        };

        expect(getJourneyLabelDetails(journey, stationGroups)).toEqual({
            origin: {
                type: "location",
                name: "Heaton Chapel",
                stationCrs: "BNA",
            },
            destination: {
                type: "location",
                name: "Manchester Piccadilly",
                stationCrs: "EDY",
            },
            connectingStationCrs: undefined,
        });
    });

    it("omits a selected station for a group with one station", () => {
        const journey: Journey = {
            id: "heaton-chapel-to-liverpool",
            origin: {type: "group", groupId: "heaton-chapel"},
            destination: {type: "station", groupId: "liverpool", crs: "LIV"},
            viaCrs: "MAN",
        };

        expect(getJourneyLabelDetails(journey, stationGroups)).toEqual({
            origin: {
                type: "location",
                name: "Heaton Chapel",
                stationCrs: undefined,
            },
            destination: {
                type: "location",
                name: "Liverpool",
                stationCrs: undefined,
            },
            connectingStationCrs: "MAN",
        });
    });
});

describe("getRouteLabelDetails", () => {
    it("uses group names and the configured connecting station", () => {
        const route: JourneyRoute = {
            id: "heaton-chapel-to-liverpool:BNA-LIV",
            journeyId: "heaton-chapel-to-liverpool",
            origin: {crs: "BNA", locationName: "Heaton Chapel"},
            destination: {crs: "LIV", locationName: "Liverpool"},
            viaCrs: "MAN",
        };

        expect(getRouteLabelDetails(route)).toEqual({
            origin: {type: "location", name: "Heaton Chapel"},
            destination: {type: "location", name: "Liverpool"},
            connectingStationCrs: "MAN",
        });
    });
});

describe("getStationRouteLabelDetails", () => {
    it("uses concrete stations and the configured connecting station", () => {
        const route: JourneyRoute = {
            id: "heaton-chapel-to-manchester-piccadilly:BNA-EDY",
            journeyId: "heaton-chapel-to-manchester-piccadilly",
            origin: {crs: "BNA", locationName: "Heaton Chapel"},
            destination: {crs: "EDY", locationName: "Manchester Piccadilly"},
            viaCrs: "MAN",
        };

        expect(getStationRouteLabelDetails(route)).toEqual({
            origin: {type: "station", stationCrs: "BNA"},
            destination: {type: "station", stationCrs: "EDY"},
            connectingStationCrs: "MAN",
        });
    });
});

describe("getTimetabledJourneyLabelDetails", () => {
    it("gets the connecting station from a journey with two train legs", () => {
        const journey = getTimetabledJourney([
            {
                origin: "BNA",
                destination: "MAN",
                departure: 600,
                arrival: 620,
            },
            {
                origin: "MAN",
                destination: "LIV",
                departure: 630,
                arrival: 680,
            },
        ]);

        expect(getTimetabledJourneyLabelDetails(journey)).toEqual({
            origin: {type: "location", name: "Heaton Chapel"},
            destination: {type: "location", name: "Liverpool"},
            connectingStationCrs: "MAN",
        });
    });

    it("does not treat the destination of a direct train as a connection", () => {
        const journey = getTimetabledJourney([
            {
                origin: "BNA",
                destination: "LIV",
                departure: 600,
                arrival: 680,
            },
        ]);

        expect(getTimetabledJourneyLabelDetails(journey)).toEqual({
            origin: {type: "location", name: "Heaton Chapel"},
            destination: {type: "location", name: "Liverpool"},
            connectingStationCrs: undefined,
        });
    });
});

describe("getJourneyLabelText", () => {
    it("uses the agreed endpoint and connection wording without CRS codes", () => {
        expect(
            getJourneyLabelText({
                origin: {
                    type: "location",
                    name: "Heaton Chapel",
                    stationCrs: "BNA",
                },
                destination: {
                    type: "location",
                    name: "Manchester Piccadilly",
                    stationCrs: "EDY",
                },
                connectingStationCrs: "MAN",
            })
        ).toBe(
            "Heaton Chapel, from Burnage → Manchester Piccadilly, arriving at East Didsbury, possibly connecting through Manchester Piccadilly"
        );
    });
});

function getTimetabledJourney(
    trainLegs: TimetabledJourney["trainLegs"]
): TimetabledJourney {
    return {
        id: "heaton-chapel-to-liverpool:BNA-LIV:600",
        journeyId: "heaton-chapel-to-liverpool",
        origin: "BNA",
        originLocationName: "Heaton Chapel",
        destination: "LIV",
        destinationLocationName: "Liverpool",
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
