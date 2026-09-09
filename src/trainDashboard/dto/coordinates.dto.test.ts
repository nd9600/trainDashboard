import {expect, it} from "vitest";
import {CoordinatesInputSchema, CoordinatesSchema} from "./coordinates.dto";

it.each([
    ["", undefined],
    ["  ", undefined],
    ["55.8892, -4.3217", {latitude: 55.8892, longitude: -4.3217}],
    ["0, 0", {latitude: 0, longitude: 0}],
])("parses %j", (input, expected) => {
    expect(CoordinatesInputSchema.parse(input)).toEqual(expected);
});

it.each(["55", "55,", ", -4", "91, 0", "0, -181", "1, 2, 3", "north, west"])(
    "rejects %j",
    (input) => {
        expect(CoordinatesInputSchema.safeParse(input).success).toBe(false);
    }
);

it.each([{latitude: 55}, {longitude: -4}])(
    "rejects a stored partial pair %j",
    (coordinates) => {
        expect(CoordinatesSchema.safeParse(coordinates).success).toBe(false);
    }
);
