import {expect, it} from "vitest";
import {getNearbyStationGroup} from "./nearbyStationGroup";

it("finds the nearest group within two kilometres and ignores missing coordinates", () => {
    const groups = [
        {id: "missing", name: "Missing", stations: [{crs: "ANL"}]},
        {
            id: "farther",
            name: "Farther",
            stations: [{crs: "ANL"}],
            coordinates: {latitude: 0.005, longitude: 0},
        },
        {
            id: "nearer",
            name: "Nearer",
            stations: [{crs: "CHC"}],
            coordinates: {latitude: 0.001, longitude: 0},
        },
    ];
    expect(getNearbyStationGroup(groups, {latitude: 0, longitude: 0})?.id).toBe(
        "nearer"
    );
    expect(
        getNearbyStationGroup(groups, {latitude: 1, longitude: 0})
    ).toBeUndefined();
    expect(getNearbyStationGroup(groups, null)).toBeUndefined();
    expect(
        getNearbyStationGroup(groups, {latitude: Infinity, longitude: Infinity})
    ).toBeUndefined();
});

it("keeps the two-kilometre limit", () => {
    const group = {
        id: "home",
        name: "Home",
        stations: [{crs: "ANL"}],
        coordinates: {latitude: 0, longitude: 0},
    };
    expect(
        getNearbyStationGroup([group], {latitude: 0.015, longitude: 0})
    ).toBe(group);
    expect(
        getNearbyStationGroup([group], {latitude: 0.02, longitude: 0})
    ).toBeUndefined();
});
