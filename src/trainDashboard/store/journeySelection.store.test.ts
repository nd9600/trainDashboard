import {beforeEach, describe, expect, it, vi} from "vitest";
import {createPinia, setActivePinia} from "pinia";
import {createEphemeralJourney} from "../dto/journeySelection.dto";
import {manchesterDashboardConfig} from "../testing/manchesterDashboardConfig.fixture";
import {useJourneySelectionStore} from "./journeySelection.store";

const predictedJourney = manchesterDashboardConfig.journeys[0]!;
const savedJourney = manchesterDashboardConfig.journeys[2]!;

describe("useJourneySelectionStore", () => {
    beforeEach(() => {
        vi.stubGlobal("localStorage", new MemoryStorage());
        setActivePinia(createPinia());
    });

    it("keeps an override in memory and records the selection", () => {
        const store = useJourneySelectionStore();

        store.selectJourney(
            savedJourney,
            predictedJourney.id,
            predictedJourney,
            new Date("2026-08-27T08:00:00.000Z")
        );

        expect(store.temporaryJourney).toEqual(savedJourney);
        expect(store.recentJourneyHistory).toEqual([
            {
                type: "saved",
                journeyId: savedJourney.id,
                selectedAt: "2026-08-27T08:00:00.000Z",
            },
        ]);
    });

    it("restores prediction after the store is recreated", () => {
        const firstStore = useJourneySelectionStore();
        firstStore.selectJourney(
            savedJourney,
            predictedJourney.id,
            predictedJourney,
            new Date("2026-08-27T08:00:00.000Z")
        );

        setActivePinia(createPinia());
        const restoredStore = useJourneySelectionStore();

        expect(restoredStore.temporaryJourney).toBeUndefined();
        expect(restoredStore.recentJourneyHistory).toHaveLength(1);
    });

    it("ends an override when the predicted journey is selected", () => {
        const store = useJourneySelectionStore();
        store.selectJourney(savedJourney, predictedJourney.id);

        store.selectJourney(predictedJourney, predictedJourney.id);

        expect(store.temporaryJourney).toBeUndefined();
        expect(store.recentJourneyHistory[0]).toMatchObject({
            type: "saved",
            journeyId: predictedJourney.id,
        });
    });

    it("keeps an ephemeral journey in history after the store is recreated", () => {
        const journey = createTestEphemeralJourney("MAN", "LIV");
        const firstStore = useJourneySelectionStore();
        firstStore.selectJourney(
            journey,
            predictedJourney.id,
            predictedJourney,
            new Date("2026-08-27T08:00:00.000Z")
        );

        setActivePinia(createPinia());
        const restoredStore = useJourneySelectionStore();

        expect(restoredStore.temporaryJourney).toBeUndefined();
        expect(restoredStore.recentJourneyHistory).toEqual([
            {
                type: "ephemeral",
                journey,
                selectedAt: "2026-08-27T08:00:00.000Z",
            },
        ]);
    });

    it("replaces an ephemeral history entry when the journey is saved", () => {
        const journey = createTestEphemeralJourney("MAN", "LIV");
        const store = useJourneySelectionStore();
        store.selectJourney(journey, predictedJourney.id, predictedJourney);

        store.markEphemeralJourneySaved(journey, savedJourney);

        expect(store.temporaryJourney).toEqual(savedJourney);
        expect(store.recentJourneyHistory[0]).toMatchObject({
            type: "saved",
            journeyId: savedJourney.id,
        });
    });

    it("clears an ephemeral journey back to the prediction", () => {
        const journey = createTestEphemeralJourney("MAN", "LIV");
        const store = useJourneySelectionStore();
        store.selectJourney(journey, predictedJourney.id, predictedJourney);

        store.clearEphemeralJourney(predictedJourney.id);

        expect(store.temporaryJourney).toBeUndefined();
        expect(store.recentJourneyHistory[0]).toMatchObject({
            type: "ephemeral",
            journey,
        });
    });

    it("clears an ephemeral journey back to the previous override", () => {
        const journey = createTestEphemeralJourney("MAN", "LIV");
        const store = useJourneySelectionStore();
        store.selectJourney(
            savedJourney,
            predictedJourney.id,
            predictedJourney
        );
        store.selectJourney(journey, predictedJourney.id, savedJourney);

        store.clearEphemeralJourney(predictedJourney.id);

        expect(store.temporaryJourney).toEqual(savedJourney);
    });

    it("restores the previous prediction after the prediction changes", () => {
        const journey = createTestEphemeralJourney("MAN", "LIV");
        const nextPrediction = manchesterDashboardConfig.journeys[1]!;
        const store = useJourneySelectionStore();
        store.selectJourney(journey, predictedJourney.id, predictedJourney);

        store.clearEphemeralJourney(nextPrediction.id);

        expect(store.temporaryJourney).toEqual(predictedJourney);
    });

    it("clears consecutive ephemeral journeys in selection order", () => {
        const firstJourney = createTestEphemeralJourney("MAN", "LIV");
        const secondJourney = createTestEphemeralJourney("EDY", "LIV");
        const store = useJourneySelectionStore();
        store.selectJourney(
            firstJourney,
            predictedJourney.id,
            predictedJourney
        );
        store.selectJourney(secondJourney, predictedJourney.id, firstJourney);

        store.clearEphemeralJourney(predictedJourney.id);
        expect(store.temporaryJourney).toEqual(firstJourney);

        store.clearEphemeralJourney(predictedJourney.id);
        expect(store.temporaryJourney).toBeUndefined();
    });
});

function createTestEphemeralJourney(originCrs: string, destinationCrs: string) {
    return createEphemeralJourney({
        origin: {type: "station", crs: originCrs},
        destination: {type: "station", crs: destinationCrs},
    })!;
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
