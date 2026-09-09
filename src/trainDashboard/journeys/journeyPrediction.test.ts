import {describe, expect, it} from "vitest";
import type {DashboardConfig} from "../dto/dashboardConfig.dto";
import {manchesterDashboardConfig} from "../testing/manchesterDashboardConfig.fixture";
import {getJourneyPrediction} from "./journeyPrediction";

describe("getJourneyPrediction", () => {
    it.each([
        {day: 1, minutes: 8 * 60, scheduleId: "weekday-morning"},
        {day: 3, minutes: 12 * 60, scheduleId: "weekday-afternoon"},
        {day: 6, minutes: 14 * 60, scheduleId: "weekend"},
    ] as const)(
        "uses $scheduleId at its configured day and time",
        ({day, minutes, scheduleId}) => {
            const prediction = getJourneyPrediction(
                manchesterDashboardConfig,
                {day, minutes},
                null
            );

            expect(prediction.reason).toMatchObject({scheduleId});
            expect(prediction.predictedJourneyId).toBe(
                manchesterDashboardConfig.schedules.find(
                    (schedule) => schedule.id === scheduleId
                )?.journeyId
            );
        }
    );
});

const locationConfig: DashboardConfig = {
    version: 3,
    stationGroups: [
        {
            id: "home",
            name: "Home",
            stations: [{crs: "ANL"}],
            coordinates: {latitude: 55.89, longitude: -4.32},
        },
        {
            id: "work",
            name: "Work",
            stations: [{crs: "CHC"}],
            coordinates: {latitude: 55.86, longitude: -4.27},
        },
    ],
    journeys: [
        {
            id: "out",
            origin: {type: "group", groupId: "home"},
            destination: {type: "group", groupId: "work"},
        },
        {
            id: "back",
            origin: {type: "group", groupId: "work"},
            destination: {type: "group", groupId: "home"},
        },
        {
            id: "gym",
            origin: {type: "station", crs: "CHC"},
            destination: {type: "station", crs: "PTK"},
        },
    ],
    schedules: [
        {
            id: "morning",
            name: "Morning",
            days: [1],
            startsAt: "08:00",
            endsAt: "12:00",
            journeyId: "out",
        },
        {
            id: "evening",
            name: "Evening",
            days: [1],
            startsAt: "17:00",
            endsAt: "18:00",
            journeyId: "back",
        },
        {
            id: "lunch",
            name: "Lunch",
            days: [1],
            startsAt: "12:00",
            endsAt: "13:00",
            journeyId: "gym",
        },
        {
            id: "later",
            name: "Later",
            days: [2],
            startsAt: "17:00",
            endsAt: "18:00",
            journeyId: "back",
        },
    ],
};
const workCoordinates = {latitude: 55.86, longitude: -4.27};

it("includes an unscheduled saved journey from home after the morning commute", () => {
    const config: DashboardConfig = {
        ...locationConfig,
        journeys: [
            ...locationConfig.journeys,
            {
                id: "edinburgh",
                origin: {type: "group", groupId: "home"},
                destination: {type: "station", crs: "EDB"},
            },
        ],
    };

    const prediction = getJourneyPrediction(
        config,
        {day: 1, minutes: 9 * 60},
        {latitude: 55.89, longitude: -4.32}
    );

    expect(prediction).toMatchObject({
        predictedJourneyId: "out",
        alternativeJourneyIds: ["edinburgh"],
        reason: {type: "schedule", scheduleId: "morning", timing: "active"},
    });
});

it("overrides a schedule from elsewhere with the next schedule from the nearby group", () => {
    const prediction = getJourneyPrediction(
        locationConfig,
        {day: 1, minutes: 9 * 60},
        workCoordinates
    );
    expect(prediction).toEqual({
        predictedJourneyId: "gym",
        alternativeJourneyIds: ["back"],
        nearbyStationGroupId: "work",
        reason: {type: "schedule", scheduleId: "lunch", timing: "upcoming"},
    });
});

it.each([
    [1, 17 * 60, "back", "active"],
    [1, 18 * 60, "back", "upcoming"],
    [0, 23 * 60, "gym", "upcoming"],
] as const)(
    "orders active and upcoming schedules across days: %i %i",
    (day, minutes, journeyId, timing) => {
        const prediction = getJourneyPrediction(
            locationConfig,
            {day, minutes},
            workCoordinates
        );
        expect(prediction.predictedJourneyId).toBe(journeyId);
        expect(prediction.reason).toMatchObject({type: "schedule", timing});
    }
);

it("uses saved order when no schedules start at the nearby group", () => {
    const config = {
        ...locationConfig,
        schedules: [locationConfig.schedules[0]!],
    };
    const prediction = getJourneyPrediction(
        config,
        {day: 1, minutes: 9 * 60},
        workCoordinates
    );
    expect(prediction).toMatchObject({
        predictedJourneyId: "back",
        alternativeJourneyIds: ["gym"],
        reason: {type: "saved", onlyJourney: false},
    });
});

it("reports only the nearby group when no journey starts there", () => {
    const config = {...locationConfig, journeys: [locationConfig.journeys[0]!]};
    const prediction = getJourneyPrediction(
        config,
        {day: 1, minutes: 9 * 60},
        workCoordinates
    );
    expect(prediction).toMatchObject({
        predictedJourneyId: undefined,
        nearbyStationGroupId: "work",
        alternativeJourneyIds: [],
        reason: {type: "nearby"},
    });
});

it("falls back to time when no group is near, without using recent history", () => {
    const prediction = getJourneyPrediction(
        locationConfig,
        {day: 1, minutes: 9 * 60},
        {latitude: 0, longitude: 0}
    );
    expect(prediction).toMatchObject({
        predictedJourneyId: "out",
        nearbyStationGroupId: undefined,
        reason: {type: "schedule", scheduleId: "morning", timing: "active"},
    });
    expect(
        getJourneyPrediction(locationConfig, {day: 3, minutes: 9 * 60}, null)
            .predictedJourneyId
    ).toBeUndefined();
});

it.each([
    {
        day: 2,
        coordinates: {latitude: 55.89, longitude: -4.32},
        expected: "out",
        alternatives: [],
    },
    {
        day: 2,
        coordinates: {latitude: 55.95, longitude: -3.19},
        expected: "edinburgh",
        alternatives: [],
    },
    {day: 2, coordinates: null, expected: "out", alternatives: ["edinburgh"]},
    {day: 1, coordinates: null, expected: "out", alternatives: []},
] as const)(
    "resolves overlapping commutes: $day $coordinates",
    ({day, coordinates, expected, alternatives}) => {
        const config: DashboardConfig = {
            ...locationConfig,
            stationGroups: [
                ...locationConfig.stationGroups,
                {
                    id: "edinburgh",
                    name: "Edinburgh",
                    stations: [{crs: "EDB"}],
                    coordinates: {latitude: 55.95, longitude: -3.19},
                },
            ],
            journeys: [
                ...locationConfig.journeys,
                {
                    id: "edinburgh",
                    origin: {type: "station", crs: "EDB"},
                    destination: {type: "station", crs: "CHC"},
                },
            ],
            schedules: [
                {...locationConfig.schedules[0]!, days: [1, 2, 3, 4, 5]},
                {
                    ...locationConfig.schedules[0]!,
                    id: "edinburgh",
                    days: [2],
                    journeyId: "edinburgh",
                },
                {...locationConfig.schedules[0]!, id: "duplicate", days: [2]},
            ],
        };
        const clock = {day, minutes: 9 * 60};
        expect(getJourneyPrediction(config, clock, coordinates)).toMatchObject({
            predictedJourneyId: expected,
            alternativeJourneyIds: alternatives,
        });

        if (day === 2 && coordinates === null) {
            const edinburghSchedule = config.schedules.splice(1, 1)[0]!;
            config.schedules.unshift(edinburghSchedule);
            expect(getJourneyPrediction(config, clock, null)).toMatchObject({
                predictedJourneyId: "edinburgh",
                alternativeJourneyIds: ["out"],
                reason: {
                    type: "schedule",
                    scheduleId: "edinburgh",
                    timing: "active",
                },
            });
        }
    }
);
