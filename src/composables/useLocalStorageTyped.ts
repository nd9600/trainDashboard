import type {z} from "zod";

export const useLocalStorageTyped = <T extends z.ZodType<unknown>>(
    key: string,
    schema: T,
    defaultValue: z.output<T>
) => {
    const loadFromLocalStorage = (): z.output<T> => {
        const parsedData = schema.safeParse(
            JSON.parse(localStorage.getItem(key) ?? "{}")
        );
        if (!parsedData.success) {
            localStorage.removeItem(key);
            return defaultValue;
        }
        return parsedData.data;
    };
    const saveToLocalStorage = (data: z.output<T>): void => {
        localStorage.setItem(key, JSON.stringify(data));
    };

    return {
        loadFromLocalStorage,
        saveToLocalStorage,
    };
};
