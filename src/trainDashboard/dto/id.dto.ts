import {z} from "zod";

export const IdSchema = z
    .string()
    .min(1)
    .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Use lowercase letters, numbers, and hyphens."
    );
