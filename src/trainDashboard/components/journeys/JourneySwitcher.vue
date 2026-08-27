<template>
    <div
        v-if="savedJourneys.length"
        class="mr-4 flex flex-col items-start gap-2"
    >
        <p
            v-if="activeSchedule && !hasTemporaryJourneyOverride"
            class="m-0 text-xs text-ink-subtle"
        >
            {{ activeSchedule.name }}
        </p>
        <button
            class="appButton appButton--quiet max-w-full justify-start whitespace-normal text-left border-none p-1"
            type="button"
            aria-haspopup="dialog"
            :aria-label="switcherButtonLabel"
            @click="openSwitcher"
        >
            <JourneyLabel
                v-if="activeJourney"
                class="min-w-0 text-xs"
                :details="getJourneyLabelDetails(activeJourney, stationGroups)"
                :shouldSayWhenDirect="false"
            />
            <span v-else>Choose a journey</span>
            <span
                v-if="hasTemporaryJourneyOverride"
                class="shrink-0 rounded-full bg-highlight px-2 py-0.5 text-xs font-medium text-ink-muted"
            >
                Temporary
            </span>
            <AppIcon
                class="size-3 shrink-0 rotate-90 transition-transform"
                name="chevron"
            />
        </button>
    </div>

    <AppModal
        :isOpen="isOpen"
        closeLabel="Close journey switcher"
        rootClass="sm:w-fit"
        spotlightVariantPlacement="top"
        @close="isOpen = false"
    >
        <template #header>Choose a journey</template>

        <div class="p-3 sm:p-4">
            <ul
                class="divide-y divide-line overflow-hidden rounded-lg border border-line bg-paper"
            >
                <li v-for="journey in orderedJourneys" :key="journey.id">
                    <button
                        class="flex w-full gap-3 p-3 text-left transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary sm:p-4"
                        type="button"
                        @click="selectJourney(journey.id)"
                    >
                        <span
                            class="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border"
                            :class="
                                journey.id === activeJourneyId
                                    ? 'border-primary bg-primary text-paper'
                                    : 'border-line-strong text-transparent'
                            "
                            aria-hidden="true"
                        >
                            ✓
                        </span>
                        <span class="min-w-0 grow">
                            <span
                                class="flex flex-wrap items-center justify-between gap-x-3 gap-y-1"
                            >
                                <strong class="min-w-0 font-semibold text-ink">
                                    <JourneyLabel
                                        class="text-sm"
                                        :details="
                                            getJourneyLabelDetails(
                                                journey,
                                                stationGroups
                                            )
                                        "
                                        :shouldSayWhenDirect="false"
                                    />
                                </strong>
                                <span
                                    v-if="journey.id === predictedJourneyId"
                                    class="shrink-0 rounded-full bg-surface px-2 py-0.5 text-xs font-medium text-ink-muted"
                                >
                                    Predicted
                                </span>
                            </span>
                            <span
                                v-if="journey.id === activeJourneyId"
                                class="sr-only"
                            >
                                Current journey.
                            </span>
                        </span>
                    </button>
                </li>
            </ul>
        </div>

        <template
            v-if="hasTemporaryJourneyOverride && predictedJourneyId"
            #footer
        >
            <button
                class="appButton appButton--secondary w-full sm:w-auto"
                type="button"
                @click="selectPrediction"
            >
                Use predicted journey
            </button>
        </template>
    </AppModal>
</template>

<script setup lang="ts">
import {storeToRefs} from "pinia";
import {computed, ref} from "vue";
import AppIcon from "@/components/AppIcon.vue";
import AppModal from "@/components/Modal/AppModal.vue";
import {useDashboardConfigStore} from "../../store/dashboardConfig.store";
import {useTrainServicesStore} from "../../store/trainServices.store";
import {
    getJourneyLabelDetails,
    getJourneyLabelText,
} from "../../journeys/journeyLabels";
import JourneyLabel from "./JourneyLabel.vue";

const dashboardConfigStore = useDashboardConfigStore();
const trainServicesStore = useTrainServicesStore();
const {config} = storeToRefs(dashboardConfigStore);
const {
    activeJourneyId,
    activeSchedule,
    hasTemporaryJourneyOverride,
    predictedJourneyId,
} = storeToRefs(trainServicesStore);
const isOpen = ref(false);

const savedJourneys = computed(() => config.value.journeys);
const stationGroups = computed(() => config.value.stationGroups);
const activeJourney = computed(() =>
    savedJourneys.value.find((journey) => journey.id === activeJourneyId.value)
);
const orderedJourneys = computed(() =>
    [...savedJourneys.value].sort(
        (first, second) =>
            Number(second.id === predictedJourneyId.value) -
            Number(first.id === predictedJourneyId.value)
    )
);
const switcherButtonLabel = computed(() => {
    if (!activeJourney.value) {
        return "Choose a journey";
    }

    const label = getJourneyLabelText(
        getJourneyLabelDetails(activeJourney.value, stationGroups.value)
    );

    return `Change journey. Current journey: ${label}`;
});

function openSwitcher(): void {
    isOpen.value = true;
}

function selectJourney(journeyId: string): void {
    trainServicesStore.selectSavedJourney(journeyId);
    isOpen.value = false;
}

function selectPrediction(): void {
    trainServicesStore.usePredictedJourney();
    isOpen.value = false;
}
</script>
