import {defineStore} from "pinia";
import {computed, type ComputedRef, ref, watch} from "vue";
import type {TimetabledJourney} from "../dto/timetabledJourney.dto";
import type {JourneyRoute} from "../journeys/planning/journeyRoutes";
import {
    type CurrentClock,
    getActiveSchedule,
    getPredictedJourney,
    getRecentJourneys,
} from "../journeys/planning/journeySelection";
import {getDashboardJourneys} from "../journeys/getDashboardJourneys";
import {useRailDataApiStore} from "./railDataApi.store";
import {useDashboardConfigStore} from "./dashboardConfig.store";
import {useJourneySelectionStore} from "./journeySelection.store";
import type {
    Day,
    JourneyFields,
} from "@/trainDashboard/dto/dashboardConfig.dto.ts";
import {
    createEphemeralJourney,
    isEphemeralJourney,
} from "../dto/journeySelection.dto";
import type {JourneyHistoryEntry} from "../dto/journeyHistory.dto";

export const useTrainServicesStore = defineStore("train-services", () => {
    const dashboardConfigStore = useDashboardConfigStore();
    const apiStore = useRailDataApiStore();
    const journeySelectionStore = useJourneySelectionStore();
    const predictionJourneyHistory = ref<JourneyHistoryEntry[]>([
        ...journeySelectionStore.recentJourneyHistory,
    ]);

    ///// state /////
    const currentDate = ref(new Date());

    const routes = ref<JourneyRoute[]>([]);
    const journeys = ref<TimetabledJourney[]>([]);
    const isLoadingJourneys = ref(true);
    const journeyLoadError = ref<string>();

    ///// getters /////
    const currentClock: ComputedRef<CurrentClock> = computed(() => ({
        day: currentDate.value.getDay() as Day,
        minutes:
            currentDate.value.getHours() * 60 + currentDate.value.getMinutes(),
    }));
    const currentMinutes = computed(() => currentClock.value.minutes);
    const activeSchedule = computed(() =>
        getActiveSchedule(
            dashboardConfigStore.config.schedules,
            currentClock.value
        )
    );
    const predictedJourney = computed(() =>
        getPredictedJourney(
            dashboardConfigStore.config.journeys,
            activeSchedule.value,
            predictionJourneyHistory.value
        )
    );
    const predictedJourneyId = computed(() => predictedJourney.value?.id);
    const recentJourneyHistory = computed(
        () => journeySelectionStore.recentJourneyHistory
    );
    const temporaryJourney = computed(() => {
        const journey = journeySelectionStore.temporaryJourney;

        if (!journey || journey.id === predictedJourneyId.value) {
            return undefined;
        }

        if (isEphemeralJourney(journey)) {
            return journey;
        }

        return dashboardConfigStore.config.journeys.find(
            (savedJourney) => savedJourney.id === journey.id
        );
    });
    const activeJourney = computed(
        () => temporaryJourney.value ?? predictedJourney.value
    );
    const activeJourneyId = computed(() => activeJourney.value?.id);
    const hasTemporaryJourneyOverride = computed(
        () => temporaryJourney.value !== undefined
    );
    const activeJourneyIsEphemeral = computed(() =>
        isEphemeralJourney(activeJourney.value)
    );
    const recommendedJourney = computed(() =>
        journeys.value.find((journey) => journey.recommended)
    );

    ///// actions /////
    async function refreshJourneys(): Promise<void> {
        isLoadingJourneys.value = true;
        journeyLoadError.value = undefined;

        const consumerKey = apiStore.settings.consumerKey;

        try {
            const dashboardJourneys = await getDashboardJourneys(
                dashboardConfigStore.config,
                currentClock.value,
                consumerKey,
                {
                    temporaryJourney: temporaryJourney.value,
                    recentJourneyHistory: predictionJourneyHistory.value,
                }
            );

            routes.value = dashboardJourneys.routes;
            journeys.value = dashboardJourneys.journeys;

            if (!consumerKey) {
                journeyLoadError.value =
                    "Add your Consumer key in Settings → API.";
            }
        } catch {
            journeys.value = [];
            journeyLoadError.value =
                "Train data could not be loaded. Try again later.";
        } finally {
            isLoadingJourneys.value = false;
        }
    }

    function selectJourney(journeyId: string): void {
        const journey = [
            ...dashboardConfigStore.config.journeys,
            ...getRecentJourneys(
                dashboardConfigStore.config.journeys,
                recentJourneyHistory.value
            ),
        ].find((candidate) => candidate.id === journeyId);

        if (!journey) {
            return;
        }

        journeySelectionStore.selectJourney(
            journey,
            predictedJourneyId.value,
            activeJourney.value
        );
    }

    function selectEphemeralJourney(journeyFields: JourneyFields): boolean {
        const journey = createEphemeralJourney(journeyFields);

        if (!journey) {
            return false;
        }

        journeySelectionStore.selectJourney(
            journey,
            predictedJourneyId.value,
            activeJourney.value
        );
        return true;
    }

    function saveActiveEphemeralJourney(): boolean {
        const journey = activeJourney.value;

        if (!isEphemeralJourney(journey)) {
            return false;
        }

        const savedJourney = dashboardConfigStore.saveStationJourney(
            journey.origin.crs,
            journey.destination.crs,
            journey.viaCrs
        );

        if (!savedJourney) {
            return false;
        }

        journeySelectionStore.markEphemeralJourneySaved(journey, savedJourney);
        predictionJourneyHistory.value = predictionJourneyHistory.value.map(
            (entry) =>
                entry.type === "ephemeral" && entry.journey.id === journey.id
                    ? {
                          type: "saved",
                          journeyId: savedJourney.id,
                          selectedAt: entry.selectedAt,
                      }
                    : entry
        );
        return true;
    }

    function clearActiveEphemeralJourney(): boolean {
        return journeySelectionStore.clearEphemeralJourney(
            predictedJourneyId.value
        );
    }

    const updateClock = () => {
        currentDate.value = new Date();
    };

    // update the click within 5s of every minute change, and whenever the tab becomes visible
    let previousMinuteParity = currentMinutes.value % 2;
    setInterval(function () {
        const currentMinuteParity = new Date().getMinutes() % 2;
        if (currentMinuteParity !== previousMinuteParity) {
            console.log("updateClock");
            updateClock();
            previousMinuteParity = currentMinuteParity;
        }
    }, 1000);

    ///// effects /////
    watch(
        [
            () => dashboardConfigStore.config,
            () => apiStore.settings.consumerKey,
            currentMinutes,
            temporaryJourney,
        ],
        refreshJourneys,
        {immediate: true}
    );

    ///// public API /////
    return {
        activeSchedule,
        isLoadingJourneys,
        journeyLoadError,
        currentMinutes,
        activeJourneyId,
        activeJourney,
        activeJourneyIsEphemeral,
        predictedJourneyId,
        predictedJourney,
        hasTemporaryJourneyOverride,
        recentJourneyHistory,
        journeys,
        routes,
        recommendedJourney,
        selectJourney,
        selectEphemeralJourney,
        saveActiveEphemeralJourney,
        clearActiveEphemeralJourney,
    };
});
