import {createPinia, disposePinia, setActivePinia} from "pinia";
import {nextTick} from "vue";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {MemoryStorage} from "../../testing/MemoryStorage";
import * as dashboardJourneys from "../journeys/getDashboardJourneys";
import {getStationRoutes} from "../journeys/planning/journeyRoutes";
import {manchesterDashboardConfig} from "../testing/manchesterDashboardConfig.fixture";
import {useDashboardConfigStore} from "./dashboardConfig.store";
import {useJourneySelectionStore} from "./journeySelection.store";
import {useRailDataApiStore} from "./railDataApi.store";
import {useTrainServicesStore} from "./trainServices.store";

type DashboardJourneys = Awaited<ReturnType<typeof dashboardJourneys.getDashboardJourneys>>;

function createPendingRequest() {
    let resolve!: (result: DashboardJourneys) => void;
    let reject!: (error: Error) => void;
    const promise = new Promise<DashboardJourneys>((resolvePromise, rejectPromise) => {
        resolve = resolvePromise;
        reject = rejectPromise;
    });
    return {promise, resolve, reject};
}

function getResult(journeyIndex: number): DashboardJourneys {
    const journey = manchesterDashboardConfig.journeys[journeyIndex]!;
    const routes = getStationRoutes(journey, manchesterDashboardConfig.stationGroups);
    const route = routes[0]!;
    return {
        routes,
        journeys: [
            {
                id: route.id,
                journeyId: journey.id,
                origin: route.origin.crs,
                originLocationName: route.origin.locationName,
                destination: route.destination.crs,
                destinationLocationName: route.destination.locationName,
                railArrivalTime: "09:00",
                walkingTimesKnown: false,
                segments: [{kind: "train", start: 500, end: 540}],
                trainLegs: [
                    {
                        serviceId: route.id,
                        origin: route.origin.crs,
                        destination: route.destination.crs,
                        departure: 500,
                        arrival: 540,
                    },
                ],
            },
        ],
    };
}

describe("useTrainServicesStore", () => {
    let pinia: ReturnType<typeof createPinia>;

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 7, 24, 8, 0));
        vi.stubGlobal("localStorage", new MemoryStorage());
        pinia = createPinia();
        setActivePinia(pinia);
        const config = structuredClone(manchesterDashboardConfig);
        config.stationGroups[2]!.coordinates = {latitude: 53.4, longitude: -3};
        useDashboardConfigStore().saveConfig(config);
        useRailDataApiStore().saveSettings({consumerKey: "test-key"});
    });

    afterEach(() => {
        disposePinia(pinia);
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
        vi.clearAllTimers();
        vi.useRealTimers();
    });

    it.each(["success", "failure"])(
        "ignores an old request's %s while location-based trains are loading",
        async (outcome) => {
            const first = createPendingRequest();
            const second = createPendingRequest();
            vi.spyOn(dashboardJourneys, "getDashboardJourneys")
                .mockReturnValueOnce(first.promise)
                .mockReturnValueOnce(second.promise);
            const store = useTrainServicesStore();

            useJourneySelectionStore().currentCoordinates = {
                latitude: 53.4,
                longitude: -3,
            };
            await nextTick();
            expect(useJourneySelectionStore().activeJourneyId).toBe("liverpool-to-heaton-chapel");

            if (outcome === "success") first.resolve(getResult(0));
            else first.reject(new Error("Old request failed"));
            await nextTick();

            expect(store.journeys).toEqual([]);
            expect(store.routes).toEqual([]);
            expect(store.journeyLoadError).toBeUndefined();
            expect(store.isLoadingJourneys).toBe(true);

            second.resolve(getResult(3));
            await nextTick();
            expect(store.journeys).toEqual(getResult(3).journeys);
            expect(store.isLoadingJourneys).toBe(false);
        }
    );

    it.each(["success", "failure"])(
        "keeps the latest trains after an old request's %s",
        async (outcome) => {
            const first = createPendingRequest();
            vi.spyOn(dashboardJourneys, "getDashboardJourneys")
                .mockReturnValueOnce(first.promise)
                .mockResolvedValueOnce(getResult(3));
            const store = useTrainServicesStore();

            useJourneySelectionStore().currentCoordinates = {
                latitude: 53.4,
                longitude: -3,
            };
            await nextTick();
            await nextTick();

            if (outcome === "success") first.resolve(getResult(0));
            else first.reject(new Error("Old request failed"));
            await nextTick();

            expect(store.journeys).toEqual(getResult(3).journeys);
            expect(store.routes).toEqual(getResult(3).routes);
            expect(store.journeyLoadError).toBeUndefined();
            expect(store.isLoadingJourneys).toBe(false);
        }
    );

    it("clears displayed trains when location selects a different journey", async () => {
        const second = createPendingRequest();
        vi.spyOn(dashboardJourneys, "getDashboardJourneys")
            .mockResolvedValueOnce(getResult(0))
            .mockReturnValueOnce(second.promise);
        const store = useTrainServicesStore();
        await nextTick();
        expect(store.journeys).toHaveLength(1);

        useJourneySelectionStore().currentCoordinates = {
            latitude: 53.4,
            longitude: -3,
        };
        await nextTick();

        expect(store.journeys).toEqual([]);
        expect(store.routes).toEqual([]);
        expect(store.recommendedJourney).toBeUndefined();
        expect(store.isLoadingJourneys).toBe(true);
        second.resolve(getResult(3));
        await nextTick();
    });
});
