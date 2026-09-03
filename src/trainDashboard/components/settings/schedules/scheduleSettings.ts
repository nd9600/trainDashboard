import type {Day, DisplaySchedule} from "../../../dto/displaySchedule.dto";
import type {Journey} from "../../../dto/journey.dto";
import type {StationGroup} from "../../../dto/stationGroup.dto";
import {
    getJourneyLabelDetails,
    getJourneyLabelText,
} from "../../../journeys/journeyLabels";

export const scheduleDays: Array<{value: Day; label: string}> = [
    {value: 1, label: "Monday"},
    {value: 2, label: "Tuesday"},
    {value: 3, label: "Wednesday"},
    {value: 4, label: "Thursday"},
    {value: 5, label: "Friday"},
    {value: 6, label: "Saturday"},
    {value: 0, label: "Sunday"},
];

export function getActiveDaysText(activeDays: Day[]): string {
    const selectedDays = scheduleDays.filter((day) =>
        activeDays.includes(day.value)
    );

    if (selectedDays.length === 0) {
        return "No days selected";
    }

    if (selectedDays.length === scheduleDays.length) {
        return "Every day";
    }

    return getConsecutiveDayRanges(selectedDays).map(formatDayRange).join(", ");
}

function getConsecutiveDayRanges(
    selectedDays: Array<(typeof scheduleDays)[number]>
): Array<(typeof scheduleDays)[number][]> {
    const ranges: Array<(typeof scheduleDays)[number][]> = [];

    for (const day of selectedDays) {
        const currentRange = ranges.at(-1);
        const previousDay = currentRange?.at(-1);
        const daysAreConsecutive =
            previousDay &&
            scheduleDays.indexOf(day) === scheduleDays.indexOf(previousDay) + 1;

        if (currentRange && daysAreConsecutive) {
            currentRange.push(day);
            continue;
        }

        ranges.push([day]);
    }

    return ranges;
}

function formatDayRange(range: Array<(typeof scheduleDays)[number]>): string {
    const firstDay = range.at(0)!;
    const lastDay = range.at(-1)!;

    return range.length === 1
        ? firstDay.label
        : `${firstDay.label}–${lastDay.label}`;
}

export function createEmptyJourney(): Journey {
    return {
        id: newId("journey"),
        origin: {type: "group", groupId: ""},
        destination: {type: "group", groupId: ""},
    };
}

export function hasJourneyEndpoints(
    journey: Journey,
    stationGroups: StationGroup[]
): boolean {
    return [journey.origin, journey.destination].every(
        (location) =>
            (location.type === "station" && location.groupId === undefined) ||
            stationGroups.some((group) => group.id === location.groupId)
    );
}

export function getJourneySettingsLabel(
    journey: Journey,
    stationGroups: StationGroup[]
): string {
    return getJourneyLabelText(getJourneyLabelDetails(journey, stationGroups));
}

export function getScheduleNamesUsingJourney(
    journeyId: string,
    schedules: DisplaySchedule[]
): string[] {
    return schedules
        .filter((schedule) => schedule.journeyId === journeyId)
        .map((schedule) => schedule.name);
}

function newId(prefix: string): string {
    const suffix = Math.random().toString(36).slice(2, 10);
    return `${prefix}-${suffix}`;
}
