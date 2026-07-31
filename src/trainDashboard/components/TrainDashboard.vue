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
            <div
                v-else
                class="mt-4 space-y-4"
            >
                <p
                    v-if="journeyLoadingError"
                    class="rounded-lg border border-line bg-surface p-4 text-ink-muted"
                >
                    {{ journeyLoadingError }}
                </p>
                <section>
                    <JourneyTimeline
                        v-if="primaryJourneys.length"
                        :journeys="primaryJourneys"
                        :currentMinutes="currentMinutes"
                    />
                    <NationalRailRouteLinks
                        v-if="primaryPairsWithoutJourneys.length"
                        :pairs="primaryPairsWithoutJourneys"
                        :departureMinutes="currentMinutes"
                    />
                </section>

                <OtherJourneys
                    :pairs="currentJourneyPriorities.secondaryPairs"
                    :journeys="secondaryJourneys"
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
    currentJourneyPriorities,
    isLoadingJourneys,
    journeyLoadingError,
    currentMinutes,
    primaryJourneys,
    primaryPairsWithoutJourneys,
    secondaryJourneys,
} = storeToRefs(trainServicesStore);
</script>
