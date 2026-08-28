<template>
    <main class="min-h-screen">
        <div class="mx-auto max-w-dashboard pt-8 pb-8">
            <div class="flex justify-between max-sm:px-2">
                <DashboardHeader />
                <TrainDashboardSettingsModal ref="settingsModal" />
            </div>

            <section
                v-if="hasNoJourneyConfiguration"
                class="mx-2 mt-8 rounded-lg border border-line bg-surface p-5 sm:mx-0"
                aria-labelledby="empty-dashboard-title"
            >
                <div class="flex items-start gap-3">
                    <AppIcon
                        class="mt-0.5 size-5 text-primary"
                        name="map-pin"
                    />
                    <div>
                        <h2
                            id="empty-dashboard-title"
                            class="font-semibold text-ink"
                        >
                            Set up your regular journeys
                        </h2>
                        <p class="mt-1 text-sm text-ink-muted">
                            First, add at least two station groups. Then add a
                            schedule that selects a journey.
                        </p>
                        <p
                            class="mt-3 border-l-2 border-japonica pl-3 text-sm text-ink-muted"
                        >
                            For example: add “Home” with Manchester Piccadilly,
                            add “Work” with Euston and Kings Cross, then
                            schedule Home → Work on weekday mornings.
                        </p>
                        <button
                            class="appButton appButton--primary mt-4"
                            type="button"
                            @click="settingsModal?.open()"
                        >
                            <AppIcon class="size-4" name="settings" />
                            Open journey settings
                        </button>
                    </div>
                </div>
            </section>
            <div
                v-else-if="isLoadingJourneys && !hasJourneyData"
                class="mt-8 rounded-lg border border-line bg-surface p-4 text-ink-muted"
            >
                Loading journeys...
            </div>
            <div v-else class="mt-4 space-y-4">
                <p
                    v-if="isLoadingJourneys && hasJourneyData"
                    class="rounded-lg border border-line bg-surface p-3 text-sm text-ink-muted"
                    role="status"
                >
                    Updating journeys…
                </p>
                <p
                    v-if="journeyLoadError"
                    class="rounded-lg border border-line bg-surface p-4 text-ink-muted"
                >
                    {{ journeyLoadError }}
                    <button
                        v-if="!apiKeyConfigured"
                        class="appButton appButton--secondary ml-3 py-1"
                        type="button"
                        @click="settingsModal?.openApiSettings()"
                    >
                        Open API settings
                    </button>
                </p>
                <section>
                    <JourneyTimelines
                        v-if="journeys.length > 0"
                        :journeys="journeys"
                        :currentMinutes="currentMinutes"
                        :flushOnMobile="true"
                    />
                    <p
                        v-else
                        class="rounded border border-danger bg-danger-surface p-3 text-sm text-danger-dark"
                        role="status"
                    >
                        There is no journey.
                    </p>
                </section>

                <NoJourneysFound
                    v-if="routesWithoutTimetabledJourneys.length > 0"
                    :journeyRoutes="routesWithoutTimetabledJourneys"
                    :departureMinutes="currentMinutes"
                />
            </div>
        </div>
    </main>
</template>

<script setup lang="ts">
import {storeToRefs} from "pinia";
import {computed, ref} from "vue";
import AppIcon from "@/components/AppIcon.vue";
import NoJourneysFound from "./journeys/NoJourneysFound.vue";
import JourneyTimelines from "./journeys/JourneyTimelines.vue";
import TrainDashboardSettingsModal from "./settings/TrainDashboardSettingsModal.vue";
import {useTrainServicesStore} from "../store/trainServices.store";
import {useDashboardConfigStore} from "../store/dashboardConfig.store";
import {useJourneySelectionStore} from "../store/journeySelection.store";
import DashboardHeader from "./DashboardHeader.vue";
import {getRoutesWithoutTimetabledJourneys} from "@/trainDashboard/journeys/missingTimetables/getRoutesWithoutTimetabledJourneys";

const trainServicesStore = useTrainServicesStore();
const journeySelectionStore = useJourneySelectionStore();
const dashboardConfigStore = useDashboardConfigStore();
const settingsModal = ref<{
    open: () => void;
    openApiSettings: () => void;
} | null>(null);
const {isLoadingJourneys, journeyLoadError, journeys, routes} =
    storeToRefs(trainServicesStore);
const {currentMinutes} = storeToRefs(journeySelectionStore);
const {config: dashboardConfig} = storeToRefs(dashboardConfigStore);

const hasJourneyData = computed(() => journeys.value.length > 0);
const hasNoJourneyConfiguration = computed(
    () =>
        dashboardConfig.value.stationGroups.length === 0 &&
        dashboardConfig.value.schedules.length === 0
);
const apiKeyConfigured = computed(
    () => !journeyLoadError.value?.includes("Consumer key")
);

const routesWithoutTimetabledJourneys = computed(() =>
    getRoutesWithoutTimetabledJourneys(routes.value, journeys.value)
);
</script>
