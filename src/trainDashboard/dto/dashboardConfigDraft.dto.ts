import {z} from "zod";

export function dashboardConfigErrorMessages(error: z.ZodError): string[] {
    return error.issues.map(getDashboardConfigErrorMessage);
}

function getDashboardConfigErrorMessage(issue: z.ZodError["issues"][number]): string {
    const location = getErrorLocation(issue.path);
    return location ? `${location}: ${issue.message}` : issue.message;
}

function getErrorLocation(path: PropertyKey[]): string {
    const [section, itemIndex, field, nestedIndex, nestedField] = path;

    if (section === "stationGroups" && typeof itemIndex === "number") {
        const stationGroup = `Station group ${itemIndex + 1}`;

        if (field === "stations" && typeof nestedIndex === "number") {
            const station = `${stationGroup}, station ${nestedIndex + 1}`;

            return nestedField === "walkMinutes" ? `${station} walk time` : station;
        }

        return field === "name" ? `${stationGroup} name` : stationGroup;
    }

    if (typeof itemIndex !== "number") return "";
    const sections: Record<string, {label: string; fields: Record<string, string>}> = {
        journeys: {
            label: "Journey",
            fields: {origin: "start", destination: "destination", viaCrs: "connecting station"},
        },
        schedules: {
            label: "Schedule",
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
    return `${details.label} ${itemIndex + 1}${details.fields[String(field)] ? ` ${details.fields[String(field)]}` : ""}`;
}
