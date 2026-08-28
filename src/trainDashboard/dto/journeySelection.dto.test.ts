import {describe, expect, it} from "vitest";
import {createEphemeralJourney} from "./journeySelection.dto";

describe("createEphemeralJourney", () => {
    it("uses the same journey fields as configured journeys", () => {
        const journey = createEphemeralJourney({
            origin: {type: "station", crs: "MAN"},
            destination: {type: "station", crs: "LIV"},
            viaCrs: "CRE",
        });

        expect(journey).toEqual({
            type: "ephemeral",
            id: "ephemeral:MAN-LIV",
            origin: {type: "station", crs: "MAN"},
            destination: {type: "station", crs: "LIV"},
            viaCrs: "CRE",
        });
    });

    it("rejects location groups and matching stations", () => {
        expect(
            createEphemeralJourney({
                origin: {type: "group", groupId: "home"},
                destination: {type: "station", crs: "LIV"},
            })
        ).toBeUndefined();
        expect(
            createEphemeralJourney({
                origin: {type: "station", crs: "MAN"},
                destination: {type: "station", crs: "MAN"},
            })
        ).toBeUndefined();
    });
});
