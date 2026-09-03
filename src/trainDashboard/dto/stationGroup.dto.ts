import {z} from "zod";
import {IdSchema} from "./id.dto";
import {CrsCodeSchema} from "./station.dto";

export const StationGroupSchema = z.object({
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
});
export type StationGroup = z.infer<typeof StationGroupSchema>;
