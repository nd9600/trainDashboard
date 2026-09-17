import {DashboardConfigSchema} from "./dashboardConfig.dto";
import {describe, expect, it} from "vitest";
import {manchesterDashboardConfig} from "../testing/manchesterDashboardConfig.fixture";
import {dashboardConfigErrorMessages} from "./dashboardConfigDraft.dto";

describe("DashboardConfigSchema", () => {
    it("identifies an incomplete journey by every schedule that uses it", () => {
        const config = structuredClone(manchesterDashboardConfig);
        config.journeys[0]!.origin = {type: "group", groupId: ""};
        config.journeys[0]!.destination = {type: "group", groupId: ""};
        config.schedules[1]!.journeyId = config.journeys[0]!.id;

        const result = DashboardConfigSchema.safeParse(config);

        expect(dashboardConfigErrorMessages(result.error!, config)).toEqual([
            "Schedule “Weekday morning”, Schedule “Weekday afternoon” journey start: Choose a station or group.",
            "Schedule “Weekday morning”, Schedule “Weekday afternoon” journey destination: Choose a station or group.",
        ]);
    });

    it("identifies an unscheduled journey by its endpoints", () => {
        const config = structuredClone(manchesterDashboardConfig);
        config.journeys[3]!.viaCrs = "";

        const result = DashboardConfigSchema.safeParse(config);

        expect(dashboardConfigErrorMessages(result.error!, config)).toEqual([
            "Journey “Liverpool → Heaton Chapel” connecting station: Enter a valid CRS station code.",
        ]);
    });

    it.each([
        ["Morning commute", "Schedule “Morning commute” start time"],
        ["", "Schedule 1 start time"],
    ])("identifies schedule errors with name %j", (name, location) => {
        const config = structuredClone(manchesterDashboardConfig);
        config.schedules[0]!.name = name;
        config.schedules[0]!.startsAt = "invalid";

        const result = DashboardConfigSchema.safeParse(config);

        expect(dashboardConfigErrorMessages(result.error!, config)).toContain(
            `${location}: Enter a time from 00:00 to 24:00.`
        );
    });

    it("identifies a station walk time by the group and station names", () => {
        const config = structuredClone(manchesterDashboardConfig);
        config.stationGroups[0]!.stations[1]!.walkMinutes = -1;

        const result = DashboardConfigSchema.safeParse(config);

        expect(dashboardConfigErrorMessages(result.error!, config)[0]).toMatch(
            /^Station group “Heaton Chapel”, station “Burnage” walk time:/
        );
    });

    it("describes an invalid station without exposing its data path", () => {
        const config = structuredClone(manchesterDashboardConfig);
        config.stationGroups[0]!.stations[0]!.crs = "not-a-station";

        const result = DashboardConfigSchema.safeParse(config);

        expect(result.success).toBe(false);
        expect(dashboardConfigErrorMessages(result.error!, config)).toContain(
            "Station group “Heaton Chapel”, station 1: Enter a valid CRS station code."
        );
    });

    it("accepts overlapping schedules", () => {
        const config = structuredClone(manchesterDashboardConfig);
        config.schedules.push({
            ...config.schedules[0]!,
            id: "overlapping-weekday-morning",
            name: "Overlapping weekday morning",
            startsAt: "08:00",
            endsAt: "13:00",
        });

        const result = DashboardConfigSchema.safeParse(config);

        expect(result.success).toBe(true);
    });

    it("rejects a schedule without a journey", () => {
        const config = structuredClone(manchesterDashboardConfig);
        config.schedules[0]!.journeyId = "";

        const result = DashboardConfigSchema.safeParse(config);

        expect(result.success).toBe(false);
        expect(result.error?.issues).toContainEqual(
            expect.objectContaining({
                path: ["schedules", 0, "journeyId"],
            })
        );
    });
});
