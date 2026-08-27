import {beforeEach, describe, expect, it, vi} from "vitest";
import {createPinia, setActivePinia} from "pinia";
import {useJourneySelectionStore} from "./journeySelection.store";

describe("useJourneySelectionStore", () => {
    beforeEach(() => {
        vi.stubGlobal("localStorage", new MemoryStorage());
        setActivePinia(createPinia());
    });

    it("keeps an override in memory and records the selection", () => {
        const store = useJourneySelectionStore();

        store.selectSavedJourney(
            "home-to-glasgow",
            "home-to-work",
            new Date("2026-08-27T08:00:00.000Z")
        );

        expect(store.temporaryJourneyId).toBe("home-to-glasgow");
        expect(store.recentJourneyHistory).toEqual([
            {
                journeyId: "home-to-glasgow",
                selectedAt: "2026-08-27T08:00:00.000Z",
            },
        ]);
    });

    it("restores prediction after the store is recreated", () => {
        const firstStore = useJourneySelectionStore();
        firstStore.selectSavedJourney(
            "home-to-glasgow",
            "home-to-work",
            new Date("2026-08-27T08:00:00.000Z")
        );

        setActivePinia(createPinia());
        const restoredStore = useJourneySelectionStore();

        expect(restoredStore.temporaryJourneyId).toBeUndefined();
        expect(restoredStore.recentJourneyHistory).toHaveLength(1);
    });

    it("ends an override when the predicted journey is selected", () => {
        const store = useJourneySelectionStore();
        store.selectSavedJourney("home-to-glasgow", "home-to-work");

        store.selectSavedJourney("home-to-work", "home-to-work");

        expect(store.temporaryJourneyId).toBeUndefined();
        expect(store.recentJourneyHistory[0]?.journeyId).toBe("home-to-work");
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
