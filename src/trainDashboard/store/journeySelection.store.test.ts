import {createPinia, setActivePinia} from "pinia";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {MemoryStorage} from "../../testing/MemoryStorage";
import type {DashboardConfig} from "../dto/dashboardConfig.dto";
import type {JourneyFields} from "../dto/journey.dto";
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
            currentEphemeralJourney: undefined,
            activeJourney: {type: "predicted"},
        });

        store.initialise();

        expect(store.isInitialised).toBe(true);
        expect(store.recentJourneyIds).toEqual([savedJourney.id]);
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

        store.selectJourney(predictedJourney.id);

        expect(store.activeJourney).toEqual({type: "predicted"});
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
        });
        expect(store.currentEphemeralJourney).toEqual({
            id: "man-to-liv",
            ...manchesterToLiverpool,
        });
        expect(store.activeJourneyDetails).toEqual({
            id: "man-to-liv",
            ...manchesterToLiverpool,
        });
        expect(store.recentJourneyIds).toEqual(["man-to-liv"]);
    });

    it("does not use recent history as a prediction", () => {
        useDashboardConfigStore().saveConfig(getConfigWithoutActiveSchedule());
        const firstStore = getJourneySelectionStore();
        firstStore.selectEphemeralJourney(manchesterToLiverpool);

        recreateStores();
        const restoredStore = getJourneySelectionStore();

        expect(restoredStore.activeJourney).toEqual({type: "predicted"});
        expect(restoredStore.predictedJourneyId).toBeUndefined();
        expect(restoredStore.activeJourneyDetails).toBeUndefined();
        expect(restoredStore.recentJourneyIds).toEqual(["man-to-liv"]);
        expect(restoredStore.journeyChoices[0]).toEqual({
            name: "Recent",
            journeys: [{id: "man-to-liv", ...manchesterToLiverpool}],
        });
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
        expect(store.activeJourney.type).toBe("saved");
        expect(store.currentEphemeralJourney).toBeUndefined();
        expect(
            useDashboardConfigStore().config.journeys.find(
                (journey) => journey.id === "man-to-liv"
            )
        ).toEqual({id: "man-to-liv", ...manchesterToLiverpool});
    });

    it("selects a recent ephemeral journey after a page refresh", () => {
        useDashboardConfigStore().saveConfig(getConfigWithoutActiveSchedule());
        getJourneySelectionStore().selectEphemeralJourney(
            manchesterToLiverpool
        );
        recreateStores();
        const store = getJourneySelectionStore();

        store.selectJourney("man-to-liv");

        expect(store.activeJourney).toEqual({type: "ephemeral"});
        expect(store.currentEphemeralJourney).toEqual({
            id: "man-to-liv",
            ...manchesterToLiverpool,
        });
    });

    it("removes a journey from recent history without removing a saved journey", () => {
        const store = getJourneySelectionStore();
        store.selectJourney(savedJourney.id);

        store.removeRecentJourney(savedJourney.id);

        expect(store.recentJourneyIds).toEqual([]);
        expect(useDashboardConfigStore().config.journeys).toContainEqual(
            savedJourney
        );
        expect(store.journeyChoices.at(-1)).toMatchObject({
            name: "Saved",
            journeys: expect.arrayContaining([savedJourney]),
        });
    });

    it("keeps an active ephemeral journey after removing it from history", () => {
        const store = getJourneySelectionStore();
        store.selectEphemeralJourney(manchesterToLiverpool);

        store.removeRecentJourney("man-to-liv");

        expect(store.recentJourneyIds).toEqual([]);
        expect(store.activeJourneyDetails).toEqual({
            id: "man-to-liv",
            ...manchesterToLiverpool,
        });
        expect(
            JSON.parse(
                localStorage.getItem("train-dashboard-journey-memory-v2") ?? ""
            )
        ).toEqual({recentJourneyIds: [], ephemeralJourneys: []});
    });

    it("removes an unscheduled saved journey", () => {
        const unscheduledJourney = manchesterDashboardConfig.journeys[3]!;
        const store = getJourneySelectionStore();

        store.removeSavedJourney(unscheduledJourney.id);
        expect(useDashboardConfigStore().config.journeys).not.toContainEqual(
            unscheduledJourney
        );
    });

    it("does not remove a journey used by a schedule", () => {
        const store = getJourneySelectionStore();

        store.removeSavedJourney(predictedJourney.id);
        expect(useDashboardConfigStore().config.journeys).toContainEqual(
            predictedJourney
        );
    });

    it("edits an unscheduled active saved journey", () => {
        const unscheduledJourney = manchesterDashboardConfig.journeys[3]!;
        const store = getJourneySelectionStore();
        store.selectJourney(unscheduledJourney.id);

        store.editActiveJourney({...unscheduledJourney, viaCrs: "CRE"});
        expect(store.activeJourneyDetails).toEqual({
            ...unscheduledJourney,
            viaCrs: "CRE",
        });
    });

    it("does not edit an active journey used by a schedule", () => {
        const store = getJourneySelectionStore();
        store.selectJourney(savedJourney.id);

        store.editActiveJourney({...savedJourney, viaCrs: "CRE"});
        expect(store.activeJourneyDetails).toEqual(savedJourney);
    });

    it("edits an active ephemeral journey", () => {
        const store = getJourneySelectionStore();
        store.selectEphemeralJourney(manchesterToLiverpool);

        store.editActiveJourney({
            ...manchesterToLiverpool,
            viaCrs: "CRE",
        });
        expect(store.activeJourneyDetails).toEqual({
            id: "man-to-liv",
            ...manchesterToLiverpool,
            viaCrs: "CRE",
        });
    });

    it("clears an override to the current prediction", () => {
        const store = getJourneySelectionStore();
        store.selectEphemeralJourney(manchesterToLiverpool);
        const config = structuredClone(manchesterDashboardConfig);
        config.schedules[0]!.journeyId = config.journeys[1]!.id;
        useDashboardConfigStore().saveConfig(config);

        store.clearActiveJourney();

        expect(store.activeJourney).toEqual({type: "predicted"});
        expect(store.activeJourneyDetails).toEqual(config.journeys[1]);
        expect(store.currentEphemeralJourney).toBeUndefined();
        expect(store.recentJourneyIds).toEqual(["man-to-liv"]);
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
