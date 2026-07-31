<template>
    <main class="min-h-screen">
        <div class="mx-auto w-full max-w-dashboard px-6 pt-8 pb-8">
            <div class="flex justify-between">
                <DashboardHeader />
                <TrainDashboardSettingsModal />
            </div>

            <div
                v-if="isLoadingJourneys"
                class="mt-8 rounded-lg border border-line bg-surface p-4 text-ink-muted"
            >
                Loading journeys...
            </div>
            <div v-else class="mt-4 space-y-4">
                <p
                    v-if="journeyLoadError"
                    class="rounded-lg border border-line bg-surface p-4 text-ink-muted"
                >
                    {{ journeyLoadError }}
                </p>
                <section>
                    <JourneyTimeline
                        v-if="primaryJourneys.length"
                        :journeys="primaryJourneys"
                        :currentMinutes="currentMinutes"
                    />
                    <NationalRailRouteLinks
                        v-if="primaryRoutesWithoutTimetabledJourneys.length"
                        :journeyRoutes="primaryRoutesWithoutTimetabledJourneys"
                        :departureMinutes="currentMinutes"
                    />
                </section>

                <OtherJourneys
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
import NationalRailRouteLinks from "./journeys/NationalRailRouteLinks.vue";
import JourneyTimeline from "./journeys/JourneyTimeline.vue";
import OtherJourneys from "./journeys/OtherJourneys.vue";
import TrainDashboardSettingsModal from "./settings/TrainDashboardSettingsModal.vue";
import {useTrainServicesStore} from "../store/trainServices.store";
import DashboardHeader from "./DashboardHeader.vue";

const trainServicesStore = useTrainServicesStore();
const {
    activeJourneyPlan,
    isLoadingJourneys,
    journeyLoadError,
    currentMinutes,
    primaryJourneys,
    primaryRoutesWithoutTimetabledJourneys,
    secondaryJourneys,
} = storeToRefs(trainServicesStore);
</script>
