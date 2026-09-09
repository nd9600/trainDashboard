import {z} from "zod";

export const CoordinatesSchema = z.object({
    latitude: z
        .number()
        .min(-90, "Latitude must be between -90 and 90.")
        .max(90, "Latitude must be between -90 and 90."),
    longitude: z
        .number()
        .min(-180, "Longitude must be between -180 and 180.")
        .max(180, "Longitude must be between -180 and 180."),
});
export type Coordinates = z.infer<typeof CoordinatesSchema>;

export const CoordinatesInputSchema = z
    .string()
    .trim()
    .refine(
        (value) =>
            value === "" ||
            /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)\s*,\s*[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(
                value
            ),
        "Enter latitude and longitude separated by a comma."
    )
    .transform((value) => {
        if (value === "") return undefined;
        const [latitude, longitude] = value.split(",").map(Number);
        return {latitude: latitude!, longitude: longitude!};
    })
    .pipe(CoordinatesSchema.optional());
export type CoordinatesInput = z.infer<typeof CoordinatesInputSchema>;
