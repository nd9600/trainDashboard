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
            id: "man-to-liv",
            origin: {type: "station", crs: "MAN"},
            destination: {type: "station", crs: "LIV"},
            viaCrs: "CRE",
        });
    });

    it("allocates a configured journey ID", () => {
        const journey = createEphemeralJourney(
            {
                origin: {type: "station", crs: "MAN"},
                destination: {type: "station", crs: "LIV"},
            },
            ["man-to-liv", "man-to-liv-2"]
        );

        expect(journey?.id).toBe("man-to-liv-3");
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
