<template>
    <Listbox
        v-if="savedJourneys.length"
        :modelValue="activeJourneyId"
        as="div"
        class="relative mr-4 flex w-fit max-w-full flex-col items-start gap-2"
        @update:model-value="selectJourney"
    >
        <p
            v-if="activeSchedule || hasTemporaryJourneyOverride"
            class="text-xs text-ink-subtle"
        >
            {{ hasTemporaryJourneyOverride ? "Temporary schedule" : activeSchedule?.name }}
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
            <AppIcon class="size-3 rotate-90" name="chevron" />
        </ListboxButton>

        <ListboxOptions
            class="absolute top-full left-0 z-20 mt-1 max-h-80 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-lg border border-line-strong bg-paper shadow-lg focus:outline-none"
        >
            <template v-for="section in journeySections" :key="section.name">
                <li
                    class="border-y border-line bg-canvas px-3 py-1.5 text-xs font-semibold text-ink-subtle first:border-t-0"
                    role="presentation"
                >
                    {{ section.name }}
                </li>
                <ListboxOption
                    v-for="journey in section.journeys"
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
                                    getJourneyLabelDetails(
                                        journey,
                                        stationGroups
                                    )
                                "
                                :shouldSayWhenDirect="false"
                            />
                            <span v-if="selected" class="sr-only">
                                Current journey.
                            </span>
                        </span>
                    </li>
                </ListboxOption>
            </template>
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
import type {Journey} from "../../dto/dashboardConfig.dto";
import {useDashboardConfigStore} from "../../store/dashboardConfig.store";
import {useTrainServicesStore} from "../../store/trainServices.store";
import {
    getJourneyLabelDetails,
    getJourneyLabelText,
} from "../../journeys/journeyLabels";
import {getRecentJourneys} from "../../journeys/planning/journeySelection";
import JourneyLabel from "./JourneyLabel.vue";

const dashboardConfigStore = useDashboardConfigStore();
const trainServicesStore = useTrainServicesStore();
const {config} = storeToRefs(dashboardConfigStore);
const {
    activeJourneyId,
    activeSchedule,
    hasTemporaryJourneyOverride,
    predictedJourneyId,
    recentJourneyHistory,
} = storeToRefs(trainServicesStore);

const savedJourneys = computed(() => config.value.journeys);
const stationGroups = computed(() => config.value.stationGroups);
const activeJourney = computed(() =>
    savedJourneys.value.find((journey) => journey.id === activeJourneyId.value)
);
const predictedJourney = computed(() =>
    savedJourneys.value.find(
        (journey) => journey.id === predictedJourneyId.value
    )
);
const recentJourneys = computed(() =>
    getRecentJourneys(savedJourneys.value, recentJourneyHistory.value)
        .filter((journey) => journey.id !== predictedJourneyId.value)
        .slice(0, 3)
);
const recentJourneyIds = computed(
    () => new Set(recentJourneys.value.map((journey) => journey.id))
);
const otherSavedJourneys = computed(() =>
    savedJourneys.value.filter(
        (journey) =>
            journey.id !== predictedJourneyId.value &&
            !recentJourneyIds.value.has(journey.id)
    )
);
const journeySections = computed<JourneySection[]>(() => {
    const sections: JourneySection[] = [
        {
            name: "Predicted",
            journeys: predictedJourney.value ? [predictedJourney.value] : [],
        },
        {name: "Recent", journeys: recentJourneys.value},
        {name: "Saved", journeys: otherSavedJourneys.value},
    ];

    return sections.filter((section) => section.journeys.length > 0);
});
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

interface JourneySection {
    name: "Predicted" | "Recent" | "Saved";
    journeys: Journey[];
}
</script>
