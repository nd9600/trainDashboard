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

export const stationGroupSchema = z.object({
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
});

export const locationReferenceSchema = z.discriminatedUnion("type", [
    z.object({
        type: z.literal("station"),
        groupId: idSchema,
        crs: crsCodeSchema,
    }),
    z.object({
        type: z.literal("group"),
        groupId: idSchema,
    }),
]);

export const stationPairSchema = z.object({
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
        primaryPairIds: z.array(idSchema),
        secondaryPairIds: z.array(idSchema),
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
    version: z.literal(1),
    groups: z.array(stationGroupSchema),
    pairs: z.array(stationPairSchema).min(1, "Add at least one pair."),
    schedules: z
        .array(displayScheduleSchema)
        .min(1, "Add at least one schedule."),
});

export const dashboardConfigSchema = dashboardConfigBaseSchema.superRefine(
    (config, context) => {
        reportDuplicateIds(
            config.groups,
            "groups",
            "Group IDs must be unique.",
            context
        );
        reportDuplicateIds(
            config.pairs,
            "pairs",
            "Pair IDs must be unique.",
            context
        );
        reportDuplicateIds(
            config.schedules,
            "schedules",
            "Schedule IDs must be unique.",
            context
        );

        const groupsById = new Map(
            config.groups.map((group) => [group.id, group])
        );
        const pairIds = new Set(config.pairs.map((pair) => pair.id));

        config.pairs.forEach((pair, pairIndex) => {
            for (const [endpointName, endpoint] of [
                ["origin", pair.origin],
                ["destination", pair.destination],
            ] as const) {
                const group = groupsById.get(endpoint.groupId);

                if (!group) {
                    context.addIssue({
                        code: "custom",
                        message: `Group "${endpoint.groupId}" does not exist.`,
                        path: ["pairs", pairIndex, endpointName],
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
                        path: ["pairs", pairIndex, endpointName, "crs"],
                    });
                }
            }
        });

        config.schedules.forEach((schedule, scheduleIndex) => {
            const selectedPairIds = [
                ...schedule.primaryPairIds,
                ...schedule.secondaryPairIds,
            ];

            selectedPairIds.forEach((pairId) => {
                if (!pairIds.has(pairId)) {
                    context.addIssue({
                        code: "custom",
                        message: `Pair "${pairId}" does not exist.`,
                        path: ["schedules", scheduleIndex],
                    });
                }
            });

            const primaryPairIds = new Set(schedule.primaryPairIds);
            const duplicatePairId = schedule.secondaryPairIds.find((pairId) =>
                primaryPairIds.has(pairId)
            );

            if (duplicatePairId) {
                context.addIssue({
                    code: "custom",
                    message: `Pair "${duplicatePairId}" cannot be primary and secondary.`,
                    path: ["schedules", scheduleIndex],
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

export type Day = z.output<typeof daySchema>;
export type StationGroup = z.output<typeof stationGroupSchema>;
export type LocationReference = z.output<typeof locationReferenceSchema>;
export type StationPair = z.output<typeof stationPairSchema>;
export type DisplaySchedule = z.output<typeof displayScheduleSchema>;
export type DashboardConfig = z.output<typeof dashboardConfigSchema>;

export function dashboardConfigErrorMessages(error: z.ZodError): string[] {
    return error.issues.map((issue) => {
        const location = issue.path.join(".");
        return location ? `${location}: ${issue.message}` : issue.message;
    });
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
    path: "groups" | "pairs" | "schedules",
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
