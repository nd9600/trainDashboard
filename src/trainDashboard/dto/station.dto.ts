import {z} from "zod";
import {stationNames} from "../stations/stationNames";

export const CrsCodeSchema = z
    .string()
    .trim()
    .transform((code) => code.toUpperCase())
    .refine(
        (code) => stationNames[code] !== undefined,
        "Enter a valid CRS station code."
    );
