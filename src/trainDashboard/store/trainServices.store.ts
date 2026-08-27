import {defineStore} from "pinia";
import {computed, type ComputedRef, ref, watch} from "vue";
import type {TimetabledJourney} from "../dto/timetabledJourney.dto";
import type {DisplaySchedule} from "../dto/dashboardConfig.dto";
import type {JourneyRoute} from "../journeys/planning/journeyRoutes";
import type {CurrentClock} from "../journeys/planning/journeySelection";
import {getDashboardJourneys} from "../journeys/getDashboardJourneys";
import {useRailDataApiStore} from "./railDataApi.store";
import {useDashboardConfigStore} from "./dashboardConfig.store";
import {useJourneySelectionStore} from "./journeySelection.store";
import type {Day} from "@/trainDashboard/dto/dashboardConfig.dto.ts";

export const useTrainServicesStore = defineStore("train-services", () => {
    const dashboardConfigStore = useDashboardConfigStore();
    const apiStore = useRailDataApiStore();
    const journeySelectionStore = useJourneySelectionStore();

    ///// state /////
    const currentDate = ref(new Date());

    const activeSchedule = ref<DisplaySchedule>();
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
    const predictedJourneyId = computed(() => activeSchedule.value?.journeyId);
    const temporaryJourneyId = computed(() => {
        const journeyId = journeySelectionStore.temporaryJourneyId;

        if (journeyId === predictedJourneyId.value) {
            return undefined;
        }

        return dashboardConfigStore.config.journeys.some(
            (journey) => journey.id === journeyId
        )
            ? journeyId
            : undefined;
    });
    const activeJourneyId = computed(
        () => temporaryJourneyId.value ?? predictedJourneyId.value
    );
    const hasTemporaryJourneyOverride = computed(
        () => temporaryJourneyId.value !== undefined
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
                temporaryJourneyId.value
            );

            activeSchedule.value = dashboardJourneys.activeSchedule;
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

    function selectSavedJourney(journeyId: string): void {
        if (
            !dashboardConfigStore.config.journeys.some(
                (journey) => journey.id === journeyId
            )
        ) {
            return;
        }

        journeySelectionStore.selectSavedJourney(
            journeyId,
            predictedJourneyId.value
        );
    }

    function usePredictedJourney(): void {
        journeySelectionStore.usePredictedJourney();
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
            temporaryJourneyId,
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
        predictedJourneyId,
        hasTemporaryJourneyOverride,
        journeys,
        routes,
        recommendedJourney,
        selectSavedJourney,
        usePredictedJourney,
    };
});
