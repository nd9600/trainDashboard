import {createPinia, setActivePinia} from "pinia";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import type {DashboardConfig, JourneyFields} from "../dto/dashboardConfig.dto";
import {manchesterDashboardConfig} from "../testing/manchesterDashboardConfig.fixture";
import {useDashboardConfigStore} from "./dashboardConfig.store";
import {useJourneySelectionStore as createJourneySelectionStore} from "./journeySelection.store";

const predictedJourney = manchesterDashboardConfig.journeys[0]!;
const savedJourney = manchesterDashboardConfig.journeys[2]!;
const manchesterToLiverpool: JourneyFields = {
    origin: {type: "station", crs: "MAN"},
    destination: {type: "station", crs: "LIV"},
};

describe("useJourneySelectionStore", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-08-24T07:00:00.000Z"));
        vi.stubGlobal("localStorage", new MemoryStorage());
        setActivePinia(createPinia());
        useDashboardConfigStore().saveConfig(manchesterDashboardConfig);
    });

    afterEach(() => {
        vi.clearAllTimers();
        vi.useRealTimers();
    });

    it("loads journey memory only when initialised", () => {
        localStorage.setItem(
            "train-dashboard-journey-memory-v2",
            JSON.stringify({
                recentJourneyIds: [savedJourney.id],
                ephemeralJourneys: [],
            })
        );
        const store = createJourneySelectionStore();

        expect(store.$state).toEqual({
            isInitialised: false,
            recentJourneyIds: [],
            ephemeralJourneys: [],
            predictionRecentJourneyIds: [],
            activeJourney: {type: "predicted"},
            previousActiveJourneys: [],
        });

        store.initialise();

        expect(store.isInitialised).toBe(true);
        expect(store.recentJourneyIds).toEqual([savedJourney.id]);
        expect(store.predictionRecentJourneyIds).toEqual([savedJourney.id]);
    });

    it("starts with the scheduled prediction", () => {
        const store = getJourneySelectionStore();

        expect(store.predictedJourneyId).toBe(predictedJourney.id);
        expect(store.activeJourney).toEqual({type: "predicted"});
        expect(store.activeJourneyDetails).toEqual(predictedJourney);
    });

    it("records a saved override as one recent journey ID", () => {
        const store = getJourneySelectionStore();

        store.selectJourney(savedJourney.id);
        store.selectJourney(savedJourney.id);

        expect(store.activeJourney).toEqual({
            type: "saved",
            id: savedJourney.id,
        });
        expect(store.recentJourneyIds).toEqual([savedJourney.id]);
    });

    it("groups each journey once for the switcher", () => {
        const store = getJourneySelectionStore();

        store.selectJourney(savedJourney.id);

        expect(store.journeyChoices).toEqual([
            {name: "Predicted", journeys: [predictedJourney]},
            {name: "Recent", journeys: [savedJourney]},
            {
                name: "Saved",
                journeys: manchesterDashboardConfig.journeys.filter(
                    (journey) =>
                        journey.id !== predictedJourney.id &&
                        journey.id !== savedJourney.id
                ),
            },
        ]);
    });

    it("restores prediction after the store is recreated", () => {
        const firstStore = getJourneySelectionStore();
        firstStore.selectJourney(savedJourney.id);

        recreateStores();
        const restoredStore = getJourneySelectionStore();

        expect(restoredStore.activeJourney).toEqual({type: "predicted"});
        expect(restoredStore.recentJourneyIds).toEqual([savedJourney.id]);
    });

    it("stores an ephemeral journey in the same format as saved journeys", () => {
        const store = getJourneySelectionStore();

        store.selectEphemeralJourney(manchesterToLiverpool);

        expect(store.activeJourney).toEqual({
            type: "ephemeral",
            id: "man-to-liv",
        });
        expect(store.activeJourneyDetails).toEqual({
            id: "man-to-liv",
            ...manchesterToLiverpool,
        });
        expect(store.recentJourneyIds).toEqual(["man-to-liv"]);
    });

    it("uses a recent ephemeral journey as the next page prediction", () => {
        useDashboardConfigStore().saveConfig(getConfigWithoutActiveSchedule());
        const firstStore = getJourneySelectionStore();
        firstStore.selectEphemeralJourney(manchesterToLiverpool);

        recreateStores();
        const restoredStore = getJourneySelectionStore();

        expect(restoredStore.activeJourney).toEqual({type: "predicted"});
        expect(restoredStore.predictedJourneyId).toBe("man-to-liv");
        expect(restoredStore.activeJourneyDetails).toEqual({
            id: "man-to-liv",
            ...manchesterToLiverpool,
        });
        expect(restoredStore.activeJourneyIsEphemeral).toBe(true);
    });

    it("saves an ephemeral journey without changing its ID", () => {
        const store = getJourneySelectionStore();
        store.selectEphemeralJourney(manchesterToLiverpool);

        store.saveActiveJourney();

        expect(store.activeJourney).toEqual({
            type: "saved",
            id: "man-to-liv",
        });
        expect(store.recentJourneyIds).toEqual(["man-to-liv"]);
        expect(store.activeJourneyIsEphemeral).toBe(false);
        expect(
            useDashboardConfigStore().config.journeys.find(
                (journey) => journey.id === "man-to-liv"
            )
        ).toEqual({id: "man-to-liv", ...manchesterToLiverpool});
    });

    it("saves a predicted ephemeral journey without creating an override", () => {
        useDashboardConfigStore().saveConfig(getConfigWithoutActiveSchedule());
        getJourneySelectionStore().selectEphemeralJourney(
            manchesterToLiverpool
        );
        recreateStores();
        const store = getJourneySelectionStore();

        store.saveActiveJourney();

        expect(store.activeJourney).toEqual({type: "predicted"});
        expect(store.activeJourneyIsEphemeral).toBe(false);
    });

    it("clears an ephemeral journey back to the prediction", () => {
        const store = getJourneySelectionStore();
        store.selectEphemeralJourney(manchesterToLiverpool);

        store.clearActiveJourney();

        expect(store.activeJourney).toEqual({type: "predicted"});
        expect(store.activeJourneyDetails).toEqual(predictedJourney);
        expect(store.recentJourneyIds).toEqual(["man-to-liv"]);
    });

    it("clears an ephemeral journey back to the previous saved override", () => {
        const store = getJourneySelectionStore();
        store.selectJourney(savedJourney.id);
        store.selectEphemeralJourney(manchesterToLiverpool);

        store.clearActiveJourney();

        expect(store.activeJourney).toEqual({
            type: "saved",
            id: savedJourney.id,
        });
    });

    it("restores the old prediction as an override when prediction changes", () => {
        const store = getJourneySelectionStore();
        store.selectEphemeralJourney(manchesterToLiverpool);
        const config = structuredClone(manchesterDashboardConfig);
        config.schedules[0]!.journeyId = config.journeys[1]!.id;
        useDashboardConfigStore().saveConfig(config);

        store.clearActiveJourney();

        expect(store.activeJourney).toEqual({
            type: "saved",
            id: predictedJourney.id,
        });
    });

    it("clears consecutive ephemeral journeys in selection order", () => {
        const store = getJourneySelectionStore();
        store.selectEphemeralJourney(manchesterToLiverpool);
        store.selectEphemeralJourney({
            origin: {type: "station", crs: "EDY"},
            destination: {type: "station", crs: "LIV"},
        });

        store.clearActiveJourney();
        expect(store.activeJourney).toEqual({
            type: "ephemeral",
            id: "man-to-liv",
        });

        store.clearActiveJourney();
        expect(store.activeJourney).toEqual({type: "predicted"});
    });
});

function recreateStores(): void {
    setActivePinia(createPinia());
}

function getJourneySelectionStore() {
    const store = createJourneySelectionStore();
    store.initialise();
    return store;
}

function getConfigWithoutActiveSchedule(): DashboardConfig {
    const config = structuredClone(manchesterDashboardConfig);
    config.schedules = [
        {
            ...config.schedules[0]!,
            days: [2],
        },
    ];
    return config;
}

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
