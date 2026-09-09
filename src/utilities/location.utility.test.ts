import {expect, it} from "vitest";
import {
    distanceBetweenCoordinatesKm,
    findClosestPoint,
} from "./location.utility";

it("calculates kilometres, including across the date line", () => {
    expect(
        distanceBetweenCoordinatesKm(
            {latitude: 0, longitude: 0},
            {latitude: 0, longitude: 1}
        )
    ).toBeCloseTo(111.19493, 5);
    expect(
        distanceBetweenCoordinatesKm(
            {latitude: 0, longitude: 179.999},
            {latitude: 0, longitude: -179.999}
        )
    ).toBeCloseTo(0.22239, 5);
});

it("returns the closest original point and keeps the first point on a tie", () => {
    const position = {latitude: 0, longitude: 0};
    const first = {id: "first", latitude: 0, longitude: 0.001};
    const second = {id: "second", latitude: 0, longitude: -0.001};
    expect(findClosestPoint(position, [first, second])).toBe(first);
    expect(findClosestPoint(position, [])).toBeUndefined();
});
