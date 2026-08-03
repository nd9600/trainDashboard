<template>
    <main class="min-h-screen">
        <div class="mx-auto w-full max-w-dashboard pt-8 pb-8">
            <div class="flex justify-between max-sm:px-2">
                <DashboardHeader />
                <TrainDashboardSettingsModal ref="settingsModal" />
            </div>

            <div
                v-if="isLoadingJourneys && !hasJourneyData"
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
                        class="appButton appButton--secondary ml-3 px-3 py-1"
                        type="button"
                        @click="settingsModal?.openApiSettings()"
                    >
                        Open API settings
                    </button>
                </p>
                <section
                    class="flex flex-col gap-4"
                    :class="activeJourneyPlan.secondaryRoutes.length > 0 ? ' border-b-1 border-casa pb-8' : ''"
                >
                    <JourneyTimeline
                        v-if="primaryJourneys.length"
                        :journeys="primaryJourneys"
                        :currentMinutes="currentMinutes"
                        :flushOnMobile="true"
                    />
                    <NationalRailRouteLinks
                        v-if="primaryRoutesWithoutTimetabledJourneys.length"
                        :journeyRoutes="primaryRoutesWithoutTimetabledJourneys"
                        :departureMinutes="currentMinutes"
                    />
                </section>

                <OtherJourneys
                    v-if="activeJourneyPlan.secondaryRoutes.length > 0"
                    :journeyRoutes="activeJourneyPlan.secondaryRoutes"
                    :timetabledJourneys="secondaryJourneys"
                    :currentMinutes="currentMinutes"
                />
            </div>
        </div>
    </main>
</template>

<script setup lang="ts">
import {storeToRefs} from "pinia";
import {computed, ref} from "vue";
import NationalRailRouteLinks from "./journeys/NationalRailRouteLinks.vue";
import JourneyTimeline from "./journeys/JourneyTimeline.vue";
import OtherJourneys from "./journeys/OtherJourneys.vue";
import TrainDashboardSettingsModal from "./settings/TrainDashboardSettingsModal.vue";
import {useTrainServicesStore} from "../store/trainServices.store";
import DashboardHeader from "./DashboardHeader.vue";

const trainServicesStore = useTrainServicesStore();
const settingsModal = ref<{openApiSettings: () => void} | null>(null);
const {
    activeJourneyPlan,
    isLoadingJourneys,
    journeyLoadError,
    currentMinutes,
    primaryJourneys,
    primaryRoutesWithoutTimetabledJourneys,
    secondaryJourneys,
} = storeToRefs(trainServicesStore);

const hasJourneyData = computed(
    () => primaryJourneys.value.length > 0 || secondaryJourneys.value.length > 0
);
const apiKeyConfigured = computed(
    () => !journeyLoadError.value?.includes("Consumer key")
);
</script>
