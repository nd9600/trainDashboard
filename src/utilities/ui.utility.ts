import {type ClassArray, clsx} from "clsx";
import {twMerge} from "tailwind-merge";

export type {ClassValue} from "clsx";

export const combineClasses = (...classes: ClassArray): string =>
    twMerge(clsx(classes));
