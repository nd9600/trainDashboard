import {z} from "zod";
import {timeToMinutes} from "@/utilities/time.utility";
import {IdSchema} from "./id.dto";

const DaySchema = z.union([
    z.literal(0),
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
    z.literal(6),
]);
export type Day = z.infer<typeof DaySchema>;

const TimeSchema = z
    .string()
    .regex(
        /^(?:(?:[01]\d|2[0-3]):[0-5]\d|24:00)$/,
        "Enter a time from 00:00 to 24:00."
    );

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
