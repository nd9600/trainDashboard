import {z} from "zod";
import {stationNames} from "../stations/stationNames";

export const DaySchema = z.union([
    z.literal(0),
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
    z.literal(6),
]);
export type Day = z.infer<typeof DaySchema>;

export const TimeSchema = z
    .string()
    .regex(
        /^(?:(?:[01]\d|2[0-3]):[0-5]\d|24:00)$/,
        "Enter a time from 00:00 to 24:00."
    );

export const CrsCodeSchema = z
    .string()
    .trim()
    .transform((code) => code.toUpperCase())
    .refine(
        (code) => stationNames[code] !== undefined,
        "Enter a valid CRS station code."
    );

const IdSchema = z
    .string()
    .min(1)
    .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Use lowercase letters, numbers, and hyphens."
    );

const LocationGroupIdSchema = z
    .string()
    .min(1, "Choose a station or group.")
    .pipe(IdSchema);

export const StationGroupSchema = z
    .object({
        id: IdSchema,
        name: z.string().trim().min(1, "Enter a group name."),
        stations: z
            .array(
                z.object({
                    crs: CrsCodeSchema,
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
export type StationGroup = z.infer<typeof StationGroupSchema>;

export const LocationReferenceSchema = z.discriminatedUnion("type", [
    z.object({
        type: z.literal("station"),
        groupId: LocationGroupIdSchema.optional(),
        crs: CrsCodeSchema,
    }),
    z.object({
        type: z.literal("group"),
        groupId: LocationGroupIdSchema,
    }),
]);
export type LocationReference = z.infer<typeof LocationReferenceSchema>;

export const JourneyFieldsSchema = z.object({
    origin: LocationReferenceSchema,
    destination: LocationReferenceSchema,
    viaCrs: CrsCodeSchema.optional(),
});
export type JourneyFields = z.infer<typeof JourneyFieldsSchema>;

export const JourneySchema = JourneyFieldsSchema.extend({id: IdSchema});
export type Journey = z.infer<typeof JourneySchema>;

export const DisplayScheduleSchema = z
    .object({
        id: IdSchema,
        name: z.string().trim().min(1, "Enter a schedule name."),
        days: z.array(DaySchema).min(1, "Select at least one day."),
        startsAt: TimeSchema,
        endsAt: TimeSchema,
        journeyId: IdSchema,
    })
    .refine(
        (schedule) =>
            timeToMinutes(schedule.startsAt) < timeToMinutes(schedule.endsAt),
        {
            message: "The end time must be after the start time.",
            path: ["endsAt"],
        }
    );
export type DisplaySchedule = z.infer<typeof DisplayScheduleSchema>;

const DashboardConfigBaseSchema = z.object({
    version: z.literal(3),
    stationGroups: z.array(StationGroupSchema),
    journeys: z.array(JourneySchema).min(1, "Add at least one journey."),
    schedules: z
        .array(DisplayScheduleSchema)
        .min(1, "Add at least one schedule."),
});

export const DashboardConfigSchema = DashboardConfigBaseSchema.superRefine(
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
                if (
                    endpoint.type === "station" &&
                    endpoint.groupId === undefined
                ) {
                    continue;
                }

                const groupId = endpoint.groupId;

                if (!groupId) {
                    continue;
                }

                const group = stationGroupsById.get(groupId);

                if (!group) {
                    context.addIssue({
                        code: "custom",
                        message: `Group "${groupId}" does not exist.`,
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
                [journey.origin, journey.destination].some(
                    (location) =>
                        location.groupId !== undefined &&
                        !stationGroupsById.has(location.groupId)
                )
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
export type DashboardConfig = z.infer<typeof DashboardConfigSchema>;

function getStationPairKey(
    journey: Journey,
    stationGroupsById: Map<string, StationGroup>
): string {
    return [journey.origin, journey.destination]
        .map((location) => {
            if (location.type === "group") {
                return `group:${location.groupId}`;
            }

            if (location.groupId === undefined) {
                return `station:${location.crs}`;
            }

            if (
                stationGroupsById.get(location.groupId)?.stations.length === 1
            ) {
                return `group:${location.groupId}`;
            }

            return `station:${location.groupId}:${location.crs}`;
        })
        .join("->");
}

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
