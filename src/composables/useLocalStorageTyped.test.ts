import {beforeEach, describe, expect, it, vi} from "vitest";
import {z} from "zod";
import {MemoryStorage} from "../testing/MemoryStorage";
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
