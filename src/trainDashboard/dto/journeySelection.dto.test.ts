import {describe, expect, it} from "vitest";
import {
    createEphemeralJourney,
    hasSameJourneyFields,
} from "./journeySelection.dto";

const manchesterToLiverpool = {
    origin: {type: "station" as const, crs: "MAN"},
    destination: {type: "station" as const, crs: "LIV"},
};

describe("createEphemeralJourney", () => {
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

describe("hasSameJourneyFields", () => {
    it("compares route fields without comparing IDs", () => {
        expect(
            hasSameJourneyFields(
                {id: "saved", ...manchesterToLiverpool},
                {id: "temporary", ...manchesterToLiverpool}
            )
        ).toBe(true);
        expect(
            hasSameJourneyFields(
                {id: "saved", ...manchesterToLiverpool},
                {
                    id: "temporary",
                    ...manchesterToLiverpool,
                    viaCrs: "CRE",
                }
            )
        ).toBe(false);
    });
});
