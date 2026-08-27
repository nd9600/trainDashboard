<template>
    <Listbox
        v-if="savedJourneys.length"
        :modelValue="activeJourneyId"
        as="div"
        class="relative mr-4 flex w-fit max-w-full flex-col items-start gap-2"
        @update:model-value="selectJourney"
    >
        <p
            v-if="activeSchedule && !hasTemporaryJourneyOverride"
            class="text-xs text-ink-subtle"
        >
            {{ activeSchedule.name }}
        </p>
        <ListboxButton
            class="appButton appButton--secondary max-w-full justify-start whitespace-normal text-left border-none p-1"
            :aria-label="switcherButtonLabel"
        >
            <JourneyLabel
                v-if="activeJourney"
                class="text-xs"
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
            <AppIcon class="size-3 rotate-90" name="chevron" />
        </ListboxButton>

        <ListboxOptions
            class="absolute top-full left-0 z-20 mt-1 max-h-80 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-lg border border-line-strong bg-paper shadow-lg focus:outline-none"
        >
            <ListboxOption
                v-for="journey in orderedJourneys"
                :key="journey.id"
                v-slot="{active, selected}"
                as="template"
                :value="journey.id"
            >
                <li
                    class="flex cursor-pointer gap-3 px-3 py-2 text-left transition-colors"
                    :class="{'bg-surface': active}"
                >
                    <span
                        class="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border"
                        :class="
                            selected
                                ? 'border-primary bg-primary text-paper'
                                : 'border-line-strong text-transparent'
                        "
                        aria-hidden="true"
                    >
                        ✓
                    </span>
                    <span
                        class="min-w-0 grow text-balance font-semibold text-ink"
                    >
                        <JourneyLabel
                            class="text-xs sm:text-sm"
                            :details="
                                getJourneyLabelDetails(journey, stationGroups)
                            "
                            :shouldSayWhenDirect="false"
                        />
                        <span
                            v-if="journey.id === predictedJourneyId"
                            class="ml-3 rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-ink-muted"
                        >
                            Predicted
                        </span>
                        <span v-if="selected" class="sr-only">
                            Current journey.
                        </span>
                    </span>
                </li>
            </ListboxOption>
        </ListboxOptions>
    </Listbox>
</template>

<script setup lang="ts">
import {
    Listbox,
    ListboxButton,
    ListboxOption,
    ListboxOptions,
} from "@headlessui/vue";
import {storeToRefs} from "pinia";
import {computed} from "vue";
import AppIcon from "@/components/AppIcon.vue";
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

function selectJourney(journeyId: string): void {
    trainServicesStore.selectSavedJourney(journeyId);
}
</script>
