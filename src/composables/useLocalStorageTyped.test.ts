import {beforeEach, describe, expect, it, vi} from "vitest";
import {z} from "zod";
import {useLocalStorageTyped} from "./useLocalStorageTyped";

const schema = z.object({name: z.string()});

describe("useLocalStorageTyped", () => {
    beforeEach(() => {
        vi.stubGlobal("localStorage", new MemoryStorage());
    });

    it("loads valid stored data", () => {
        localStorage.setItem(
            "settings",
            JSON.stringify({name: "Heaton Chapel"})
        );
        const storage = useLocalStorageTyped("settings", schema, {
            name: "Default",
        });

        expect(storage.loadFromLocalStorage()).toEqual({
            name: "Heaton Chapel",
        });
    });

    it("removes invalid stored data and returns the default", () => {
        localStorage.setItem("settings", JSON.stringify({name: 42}));
        const storage = useLocalStorageTyped("settings", schema, {
            name: "Default",
        });

        expect(storage.loadFromLocalStorage()).toEqual({name: "Default"});
        expect(localStorage.getItem("settings")).toBeNull();
    });

    it("saves data as JSON", () => {
        const storage = useLocalStorageTyped("settings", schema, {
            name: "Default",
        });

        storage.saveToLocalStorage({name: "Manchester Piccadilly"});

        expect(localStorage.getItem("settings")).toBe(
            JSON.stringify({name: "Manchester Piccadilly"})
        );
    });
});

class MemoryStorage implements Storage {
    private readonly values = new Map<string, string>();

    get length(): number {
        return this.values.size;
    }

    clear(): void {
        this.values.clear();
    }

    getItem(key: string): string | null {
        return this.values.get(key) ?? null;
    }

    key(index: number): string | null {
        return [...this.values.keys()][index] ?? null;
    }

    removeItem(key: string): void {
        this.values.delete(key);
    }

    setItem(key: string, value: string): void {
        this.values.set(key, value);
    }
}
