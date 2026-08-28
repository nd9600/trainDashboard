<template>
    <Listbox
        v-if="journeyChoices.length"
        :modelValue="activeJourneyId"
        as="div"
        class="relative mr-4 flex w-fit max-w-full flex-col items-start gap-2"
        @update:model-value="selectJourney"
    >
        <p
            v-if="activeSchedule || activeJourney.type !== 'predicted'"
            class="text-xs text-ink-subtle"
        >
            {{ activeJourney.type === "predicted" ? activeSchedule?.name : "&nbsp;" }}
        </p>
        <ListboxButton
            class="appButton appButton--secondary max-w-full justify-start whitespace-normal text-left border-none p-1"
            :aria-label="switcherButtonLabel"
            :disabled="isCreatingEphemeralJourney"
        >
            <JourneyLabel
                v-if="activeJourneyDetails"
                class="text-xs"
                :details="
                    getJourneyLabelDetails(activeJourneyDetails, stationGroups)
                "
                :shouldSayWhenDirect="false"
            />
            <span v-else>Choose a journey</span>
            <AppIcon class="size-3 rotate-90" name="chevron" />
        </ListboxButton>

        <ListboxOptions
            class="absolute top-full left-0 z-20 mt-1 max-h-[80vh] max-w-[calc(100vw-2rem)] overflow-y-auto rounded-lg border border-line-strong bg-paper shadow-lg focus:outline-none"
        >
            <template v-for="section in journeyChoices" :key="section.name">
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
                        class="flex items-center cursor-pointer gap-3 px-3 py-2 text-left transition-colors"
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
                                class="text-xs sm:text-sm sm:whitespace-nowrap"
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
            <ListboxOption
                v-slot="{active}"
                as="template"
                :value="newJourneyOptionId"
            >
                <li
                    class="cursor-pointer border-t border-line px-3 py-2 text-sm font-semibold text-primary transition-colors"
                    :class="{'bg-surface': active}"
                >
                    Go somewhere else…
                </li>
            </ListboxOption>
        </ListboxOptions>

        <div v-if="activeJourneyIsEphemeral">
            <button
                class="appButton appButton--quiet px-0 py-1 text-xs text-primary"
                type="button"
                @click="saveActiveJourney"
            >
                Save
            </button>
            <button
                v-if="activeJourney.type === 'ephemeral'"
                class="appButton appButton--quiet px-0 py-1 text-xs text-secondary"
                type="button"
                @click="clearActiveJourney"
            >
                Clear
            </button>
        </div>

        <EphemeralJourneyForm
            v-if="isCreatingEphemeralJourney"
            @use="useEphemeralJourney"
            @cancel="isCreatingEphemeralJourney = false"
        />
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
import {computed, ref} from "vue";
import AppIcon from "@/components/AppIcon.vue";
import type {JourneyFields} from "../../dto/dashboardConfig.dto";
import {useJourneySelectionStore} from "../../store/journeySelection.store";
import {
    getJourneyLabelDetails,
    getJourneyLabelText,
} from "../../journeys/journeyLabels";
import EphemeralJourneyForm from "./EphemeralJourneyForm.vue";
import JourneyLabel from "./JourneyLabel.vue";

const newJourneyOptionId = "__new-journey__";

const journeySelectionStore = useJourneySelectionStore();
const {
    activeJourneyId,
    activeJourney,
    activeJourneyDetails,
    activeJourneyIsEphemeral,
    activeSchedule,
    journeyChoices,
    stationGroups,
} = storeToRefs(journeySelectionStore);

const isCreatingEphemeralJourney = ref(false);
const switcherButtonLabel = computed(() => {
    if (!activeJourneyDetails.value) {
        return "Choose a journey";
    }

    const label = getJourneyLabelText(
        getJourneyLabelDetails(activeJourneyDetails.value, stationGroups.value)
    );

    return `Change journey. Current journey: ${label}`;
});

function selectJourney(journeyId: string): void {
    if (journeyId === newJourneyOptionId) {
        isCreatingEphemeralJourney.value = true;
        return;
    }

    isCreatingEphemeralJourney.value = false;
    journeySelectionStore.selectJourney(journeyId);
}

function useEphemeralJourney(journey: JourneyFields): void {
    if (!journeySelectionStore.selectEphemeralJourney(journey)) {
        return;
    }

    isCreatingEphemeralJourney.value = false;
}

function saveActiveJourney(): void {
    journeySelectionStore.saveActiveJourney();
}

function clearActiveJourney(): void {
    journeySelectionStore.clearActiveJourney();
}
</script>
