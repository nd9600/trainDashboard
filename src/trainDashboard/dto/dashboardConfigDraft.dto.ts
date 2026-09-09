import {z} from "zod";

export function dashboardConfigErrorMessages(error: z.ZodError): string[] {
    return error.issues.map(getDashboardConfigErrorMessage);
}

function getDashboardConfigErrorMessage(
    issue: z.ZodError["issues"][number]
): string {
    const location = getErrorLocation(issue.path);
    return location ? `${location}: ${issue.message}` : issue.message;
}

function getErrorLocation(path: PropertyKey[]): string {
    const [section, itemIndex, field, nestedIndex, nestedField] = path;

    if (section === "stationGroups" && typeof itemIndex === "number") {
        const stationGroup = `Station group ${itemIndex + 1}`;

        if (field === "stations" && typeof nestedIndex === "number") {
            const station = `${stationGroup}, station ${nestedIndex + 1}`;

            return nestedField === "walkMinutes"
                ? `${station} walk time`
                : station;
        }

        return field === "name" ? `${stationGroup} name` : stationGroup;
    }

    if (section === "journeys" && typeof itemIndex === "number") {
        const journey = `Journey ${itemIndex + 1}`;
        const journeyFields: Record<string, string> = {
            origin: "start",
            destination: "destination",
            viaCrs: "connecting station",
        };
        const fieldLabel =
            typeof field === "string" ? journeyFields[field] : undefined;

        return fieldLabel ? `${journey} ${fieldLabel}` : journey;
    }

    if (section === "schedules" && typeof itemIndex === "number") {
        const schedule = `Schedule ${itemIndex + 1}`;
        const scheduleFields: Record<string, string> = {
            name: "name",
            days: "days",
            startsAt: "start time",
            endsAt: "end time",
            journeyId: "journey",
        };
        const fieldLabel =
            typeof field === "string" ? scheduleFields[field] : undefined;

        return fieldLabel ? `${schedule} ${fieldLabel}` : schedule;
    }

    return "";
}
