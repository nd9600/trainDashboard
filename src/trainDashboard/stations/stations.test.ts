import {describe, expect, it} from "vitest";
import {findStationOptions, getStationCodeFromInput, getStationDisplayName} from "./stations";

describe("station lookup", () => {
    it("shows the station name and CRS code", () => {
        expect(getStationDisplayName("HTC")).toBe("Heaton Chapel (HTC)");
    });

    it.each(["HTC", "Heaton Chapel", "Heaton Chapel (HTC)"])(
        "finds Heaton Chapel from %s",
        (search) => {
            expect(getStationCodeFromInput(search)).toBe("HTC");
        }
    );

    it("returns no more than ten station matches", () => {
        expect(findStationOptions("a")).toHaveLength(10);
    });

    it.each(["Heaton", "HTC"])("searches stations with %s", (search) => {
        expect(findStationOptions(search)).toContainEqual({
            code: "HTC",
            label: "Heaton Chapel (HTC)",
            name: "Heaton Chapel",
        });
    });
});
