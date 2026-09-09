import {expect, it} from "vitest";
import {StationGroupSchema} from "./stationGroup.dto";

const group = {id: "home", name: "Home", stations: [{crs: "ANL"}]};

it.each([
    {},
    {coordinates: {latitude: 55.8892, longitude: -4.3217}},
    {coordinates: {latitude: 0, longitude: 0}},
    {coordinates: {latitude: -90, longitude: 180}},
])("preserves optional coordinates through JSON storage: %j", (coordinates) => {
    const stored = JSON.stringify({...group, ...coordinates});
    expect(StationGroupSchema.parse(JSON.parse(stored))).toEqual({
        ...group,
        ...coordinates,
    });
});

it.each([
    {latitude: -90.1},
    {latitude: 90.1},
    {longitude: -180.1},
    {longitude: 180.1},
])("rejects coordinates outside their ranges: %j", (coordinates) => {
    expect(StationGroupSchema.safeParse({...group, coordinates}).success).toBe(
        false
    );
});
