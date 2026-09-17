import {z} from "zod";
import type {DashboardConfig} from "./dashboardConfig.dto";
import type {LocationReference} from "./journey.dto";
import {stationNames} from "../stations/stationNames";

export function dashboardConfigErrorMessages(error: z.ZodError, config: DashboardConfig): string[] {
    return error.issues.map((issue) => getDashboardConfigErrorMessage(issue, config));
}

function getDashboardConfigErrorMessage(
    issue: z.ZodError["issues"][number],
    config: DashboardConfig
): string {
    const location = getErrorLocation(issue.path, config);
    return location ? `${location}: ${issue.message}` : issue.message;
}

function getErrorLocation(path: PropertyKey[], config: DashboardConfig): string {
    const [section, itemIndex, field, nestedIndex, nestedField] = path;

    if (section === "stationGroups" && typeof itemIndex === "number") {
        const group = config.stationGroups[itemIndex];
        const stationGroup = getNamedLocation("Station group", group?.name, itemIndex);

        if (field === "stations" && typeof nestedIndex === "number") {
            const crs = group?.stations[nestedIndex]?.crs;
            const station = `${stationGroup}, ${getNamedLocation("station", crs ? stationNames[crs] : undefined, nestedIndex)}`;

            return nestedField === "walkMinutes" ? `${station} walk time` : station;
        }

        return field === "name" ? `${stationGroup} name` : stationGroup;
    }

    if (typeof itemIndex !== "number") return "";
    const sections: Record<string, {label: string; fields: Record<string, string>}> = {
        journeys: {
            label: getJourneyErrorLocation(itemIndex, config),
            fields: {origin: "start", destination: "destination", viaCrs: "connecting station"},
        },
        schedules: {
            label: getNamedLocation("Schedule", config.schedules[itemIndex]?.name, itemIndex),
            fields: {
                name: "name",
                days: "days",
                startsAt: "start time",
                endsAt: "end time",
                journeyId: "journey",
            },
        },
    };
    const details = sections[String(section)];
    if (!details) return "";
    return `${details.label}${details.fields[String(field)] ? ` ${details.fields[String(field)]}` : ""}`;
}

function getNamedLocation(label: string, name: string | undefined, index: number): string {
    return name?.trim() ? `${label} “${name.trim()}”` : `${label} ${index + 1}`;
}

function getJourneyErrorLocation(index: number, config: DashboardConfig): string {
    const journey = config.journeys[index];
    if (!journey) return `Journey ${index + 1}`;

    const schedules = config.schedules
        .map((schedule, scheduleIndex) =>
            schedule.journeyId === journey.id
                ? getNamedLocation("Schedule", schedule.name, scheduleIndex)
                : undefined
        )
        .filter((label) => label !== undefined);
    if (schedules.length) return `${schedules.join(", ")} journey`;

    const origin = getLocationName(journey.origin, config);
    const destination = getLocationName(journey.destination, config);
    return origin || destination
        ? `Journey “${origin || "Not selected"} → ${destination || "Not selected"}”`
        : `Journey ${index + 1}`;
}

function getLocationName(location: LocationReference, config: DashboardConfig): string | undefined {
    const groupName = config.stationGroups.find((group) => group.id === location.groupId)?.name;
    const station = location.type === "station" ? stationNames[location.crs] : undefined;
    return groupName && station && groupName !== station
        ? `${groupName}, ${station}`
        : station || groupName;
}
