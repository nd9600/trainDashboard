import {describe, expect, it} from "vitest";
import {
    findStationOptions,
    stationCodeFromInput,
    stationDisplayName,
} from "./stations";

describe("station lookup", () => {
    it("shows the station name and CRS code", () => {
        expect(stationDisplayName("ANL")).toBe("Anniesland (ANL)");
    });

    it.each(["ANL", "Anniesland", "Anniesland (ANL)"])(
        "finds Anniesland from %s",
        (search) => {
            expect(stationCodeFromInput(search)).toBe("ANL");
        }
    );

    it("returns no more than ten station matches", () => {
        expect(findStationOptions("a")).toHaveLength(10);
    });

    it.each(["Annies", "ANL"])("searches stations with %s", (search) => {
        expect(findStationOptions(search)).toContainEqual({
            code: "ANL",
            label: "Anniesland (ANL)",
            name: "Anniesland",
        });
    });
});
