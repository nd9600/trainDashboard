import {createPinia, setActivePinia} from "pinia";
import {beforeEach, describe, expect, it, vi} from "vitest";
import {manchesterDashboardConfig} from "../testing/manchesterDashboardConfig.fixture";
import {useDashboardConfigStore} from "./dashboardConfig.store";

describe("useDashboardConfigStore", () => {
    beforeEach(() => {
        vi.stubGlobal("localStorage", new MemoryStorage());
        setActivePinia(createPinia());
    });

    it("saves an ephemeral station pair as one configured journey", () => {
        const store = useDashboardConfigStore();
        store.saveConfig(manchesterDashboardConfig);

        const firstResult = store.saveStationJourney("MAN", "LIV");
        const secondResult = store.saveStationJourney("MAN", "LIV");

        expect(firstResult).toEqual({
            id: "man-to-liv",
            origin: {type: "station", crs: "MAN"},
            destination: {type: "station", crs: "LIV"},
        });
        expect(secondResult).toEqual(firstResult);
        expect(
            store.config.journeys.filter(
                (journey) => journey.id === "man-to-liv"
            )
        ).toHaveLength(1);
    });

    it("saves a possible connecting station", () => {
        const store = useDashboardConfigStore();
        store.saveConfig(manchesterDashboardConfig);

        const result = store.saveStationJourney("MAN", "LIV", "CRE");

        expect(result).toMatchObject({
            origin: {type: "station", crs: "MAN"},
            destination: {type: "station", crs: "LIV"},
            viaCrs: "CRE",
        });
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
