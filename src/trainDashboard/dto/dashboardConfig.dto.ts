import {z} from "zod";
import {stationNames} from "../stations/stationNames";

export const daySchema = z.union([
    z.literal(0),
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
    z.literal(6),
]);

export const timeSchema = z
    .string()
    .regex(
        /^(?:(?:[01]\d|2[0-3]):[0-5]\d|24:00)$/,
        "Enter a time from 00:00 to 24:00."
    );

export const crsCodeSchema = z
    .string()
    .trim()
    .transform((code) => code.toUpperCase())
    .refine(
        (code) => stationNames[code] !== undefined,
        "Enter a valid CRS station code."
    );

const idSchema = z
    .string()
    .min(1)
    .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Use lowercase letters, numbers, and hyphens."
    );

const locationGroupIdSchema = z
    .string()
    .min(1, "Choose a station or group.")
    .pipe(idSchema);

export const stationGroupSchema = z
    .object({
        id: idSchema,
        name: z.string().trim().min(1, "Enter a group name."),
        stations: z
            .array(
                z.object({
                    crs: crsCodeSchema,
                    walkMinutes: z.number().int().min(0).optional(),
                })
            )
            .min(1, "Add at least one station."),
    })
    .superRefine((group, context) => {
        const stationCodes = new Set<string>();

        group.stations.forEach((station, stationIndex) => {
            if (stationCodes.has(station.crs)) {
                context.addIssue({
                    code: "custom",
                    message:
                        "Choose a different station. This station is already in the group.",
                    path: ["stations", stationIndex, "crs"],
                });
            }

            stationCodes.add(station.crs);
        });
    });

export const locationReferenceSchema = z.discriminatedUnion("type", [
    z.object({
        type: z.literal("station"),
        groupId: locationGroupIdSchema,
        crs: crsCodeSchema,
    }),
    z.object({
        type: z.literal("group"),
        groupId: locationGroupIdSchema,
    }),
]);

export const journeySchema = z.object({
    id: idSchema,
    origin: locationReferenceSchema,
    destination: locationReferenceSchema,
    viaCrs: crsCodeSchema.optional(),
});

export const displayScheduleSchema = z
    .object({
        id: idSchema,
        name: z.string().trim().min(1, "Enter a schedule name."),
        days: z.array(daySchema).min(1, "Select at least one day."),
        startsAt: timeSchema,
        endsAt: timeSchema,
        journeyId: idSchema,
    })
    .refine(
        (schedule) =>
            timeToMinutes(schedule.startsAt) < timeToMinutes(schedule.endsAt),
        {
            message: "The end time must be after the start time.",
            path: ["endsAt"],
        }
    );

const dashboardConfigBaseSchema = z.object({
    version: z.literal(3),
    stationGroups: z.array(stationGroupSchema),
    journeys: z.array(journeySchema).min(1, "Add at least one journey."),
    schedules: z
        .array(displayScheduleSchema)
        .min(1, "Add at least one schedule."),
});

export const dashboardConfigSchema = dashboardConfigBaseSchema.superRefine(
    (config, context) => {
        reportDuplicateIds(
            config.stationGroups,
            "stationGroups",
            "Group IDs must be unique.",
            context
        );
        reportDuplicateIds(
            config.journeys,
            "journeys",
            "Journey IDs must be unique.",
            context
        );
        reportDuplicateIds(
            config.schedules,
            "schedules",
            "Schedule IDs must be unique.",
            context
        );

        const stationGroupsById = new Map(
            config.stationGroups.map((group) => [group.id, group])
        );
        const journeyIds = new Set(
            config.journeys.map((journey) => journey.id)
        );

        config.journeys.forEach((journey, journeyIndex) => {
            for (const [endpointName, endpoint] of [
                ["origin", journey.origin],
                ["destination", journey.destination],
            ] as const) {
                if (endpoint.groupId === "") {
                    continue;
                }

                const group = stationGroupsById.get(endpoint.groupId);

                if (!group) {
                    context.addIssue({
                        code: "custom",
                        message: `Group "${endpoint.groupId}" does not exist.`,
                        path: ["journeys", journeyIndex, endpointName],
                    });
                    continue;
                }

                if (
                    endpoint.type === "station" &&
                    !group.stations.some(
                        (station) => station.crs === endpoint.crs
                    )
                ) {
                    context.addIssue({
                        code: "custom",
                        message: `Station "${endpoint.crs}" is not in group "${group.name}".`,
                        path: ["journeys", journeyIndex, endpointName, "crs"],
                    });
                }
            }
        });

        const journeyIndexesByStationPair = new Map<string, number>();

        config.journeys.forEach((journey, journeyIndex) => {
            if (
                !stationGroupsById.has(journey.origin.groupId) ||
                !stationGroupsById.has(journey.destination.groupId)
            ) {
                return;
            }

            const stationPair = getStationPairKey(journey, stationGroupsById);
            const existingJourneyIndex =
                journeyIndexesByStationPair.get(stationPair);

            if (existingJourneyIndex !== undefined) {
                context.addIssue({
                    code: "custom",
                    message: `This station pair is already used by Journey ${existingJourneyIndex + 1}.`,
                    path: ["journeys", journeyIndex],
                });
                return;
            }

            journeyIndexesByStationPair.set(stationPair, journeyIndex);
        });

        config.schedules.forEach((schedule, scheduleIndex) => {
            if (!journeyIds.has(schedule.journeyId)) {
                context.addIssue({
                    code: "custom",
                    message: `Journey "${schedule.journeyId}" does not exist.`,
                    path: ["schedules", scheduleIndex, "journeyId"],
                });
            }
        });

        config.schedules.forEach((firstSchedule, firstIndex) => {
            config.schedules
                .slice(firstIndex + 1)
                .forEach((secondSchedule, offset) => {
                    if (!schedulesOverlap(firstSchedule, secondSchedule)) {
                        return;
                    }

                    context.addIssue({
                        code: "custom",
                        message: `Schedule overlaps "${firstSchedule.name}".`,
                        path: ["schedules", firstIndex + offset + 1],
                    });
                });
        });
    }
);

function getStationPairKey(
    journey: Journey,
    stationGroupsById: Map<string, StationGroup>
): string {
    return [journey.origin, journey.destination]
        .map((location) => {
            const group = stationGroupsById.get(location.groupId);

            if (location.type === "group" || group?.stations.length === 1) {
                return `group:${location.groupId}`;
            }

            return `station:${location.groupId}:${location.crs}`;
        })
        .join("->");
}

export type Day = z.output<typeof daySchema>;
export type StationGroup = z.output<typeof stationGroupSchema>;
export type LocationReference = z.output<typeof locationReferenceSchema>;
export type Journey = z.output<typeof journeySchema>;
export type DisplaySchedule = z.output<typeof displayScheduleSchema>;
export type DashboardConfig = z.output<typeof dashboardConfigSchema>;

export function dashboardConfigErrorMessages(error: z.ZodError): string[] {
    return error.issues.map((issue) => {
        const location = getErrorLocation(issue.path);
        return location ? `${location}: ${issue.message}` : issue.message;
    });
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

export function timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(":").map(Number);

    return hours! * 60 + minutes!;
}

function schedulesOverlap(
    first: DisplaySchedule,
    second: DisplaySchedule
): boolean {
    const hasSharedDay = first.days.some((day) => second.days.includes(day));

    if (!hasSharedDay) {
        return false;
    }

    const firstStart = timeToMinutes(first.startsAt);
    const firstEnd = timeToMinutes(first.endsAt);
    const secondStart = timeToMinutes(second.startsAt);
    const secondEnd = timeToMinutes(second.endsAt);

    return firstStart < secondEnd && secondStart < firstEnd;
}

function reportDuplicateIds(
    items: Array<{id: string}>,
    path: "stationGroups" | "journeys" | "schedules",
    message: string,
    context: z.RefinementCtx
): void {
    const seenIds = new Set<string>();

    items.forEach((item, index) => {
        if (seenIds.has(item.id)) {
            context.addIssue({
                code: "custom",
                message,
                path: [path, index, "id"],
            });
        }

        seenIds.add(item.id);
    });
}
