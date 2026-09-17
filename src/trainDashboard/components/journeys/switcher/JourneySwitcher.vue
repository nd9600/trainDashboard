<template>
    <Listbox
        :modelValue="activeJourneyId"
        as="div"
        class="relative mr-4 flex w-fit max-w-full flex-col items-start gap-2"
        @update:model-value="selectJourney"
    >
        <div class="flex max-w-full items-center gap-1">
            <ListboxButton
                class="appButton appButton--secondary min-w-0 max-w-full justify-start whitespace-normal border-none p-1 text-left"
                :class="
                    activeJourneyDetails
                        ? undefined
                        : 'sr-only focus:not-sr-only focus:relative focus:m-1'
                "
                :aria-label="switcherButtonLabel"
                :disabled="!!formMode"
            >
                <JourneyLabel
                    v-if="activeJourneyDetails"
                    class="text-xs"
                    :details="getJourneyLabelDetails(activeJourneyDetails, stationGroups)"
                    :shouldSayWhenDirect="false"
                />
                <span v-else>Choose a journey</span>
                <AppIcon class="size-3 rotate-90" name="chevron" />
            </ListboxButton>
            <AppIconButton
                v-if="activeJourney.type !== 'predicted' && !formMode"
                class="appButton appButton--quiet appButton--icon size-7 shrink-0 text-ink-subtle"
                @click="journeySelectionStore.clearActiveJourney"
                label="Clear temporary journey"
                icon="close"
                iconClass="size-3.5"
            />
        </div>

        <JourneyPredictionExplanation
            :prediction="currentJourneyPrediction"
            :isPredicted="activeJourney.type === 'predicted'"
        />

        <ListboxOptions
            :static="!activeJourneyDetails && !formMode"
            class="z-20 max-h-[80vh] max-w-[calc(100vw-2rem)] overflow-y-auto rounded-lg border border-line-strong bg-paper shadow-lg focus:outline-none"
            :class="activeJourneyDetails ? 'absolute top-full left-0 mt-1' : undefined"
        >
            <template v-for="section in journeyChoices" :key="section.name">
                <li
                    class="border-y border-line bg-canvas px-3 py-1.5 text-xs font-semibold text-ink-subtle first:border-t-0"
                    role="presentation"
                >
                    {{ section.name }}
                </li>
                <JourneyChoiceOption
                    v-for="journey in section.journeys"
                    :key="journey.id"
                    :journey="journey"
                    :section="section.name"
                />
            </template>
            <ListboxOption v-slot="{active}" as="template" :value="newJourneyOptionId">
                <li
                    class="cursor-pointer border-t border-line px-3 py-2 text-sm font-semibold text-primary transition-colors"
                    :class="{'bg-surface': active}"
                >
                    Go somewhere else…
                </li>
            </ListboxOption>
        </ListboxOptions>

        <div
            v-if="
                activeJourney.type !== 'predicted' &&
                !formMode &&
                (activeJourney.type === 'ephemeral' || canEditActiveJourney)
            "
            class="flex items-center gap-2"
        >
            <button
                v-if="activeJourney.type === 'ephemeral'"
                class="appButton appButton--primary px-2 py-1 text-xs"
                type="button"
                @click="journeySelectionStore.saveActiveJourney"
            >
                <AppIcon class="size-3.5" name="bookmark" />
                Save
            </button>
            <button
                v-if="canEditActiveJourney"
                class="appButton appButton--secondary px-2 py-1 text-xs"
                type="button"
                @click="formMode = 'edit'"
            >
                <AppIcon class="size-3.5" name="pencil" />
                Edit
            </button>
        </div>

        <JourneyForm
            v-if="formMode"
            :key="`${formMode}-${activeJourneyId}`"
            :initialJourney="formMode === 'edit' ? activeJourneyDetails : undefined"
            :endpointMode="formMode === 'edit' ? activeJourneyEndpointMode : 'stations'"
            :stationGroups="stationGroups"
            :journeys="config.journeys"
            :submitLabel="formMode === 'edit' ? 'Save' : 'Use journey'"
            @submit="submitJourney"
            @cancel="formMode = undefined"
        />
    </Listbox>
</template>

<script setup lang="ts">
import AppIconButton from "@/components/AppIconButton.vue";
import {Listbox, ListboxButton, ListboxOption, ListboxOptions} from "@headlessui/vue";
import {storeToRefs} from "pinia";
import {computed, ref} from "vue";
import AppIcon from "@/components/AppIcon.vue";
import type {JourneyFields} from "../../../dto/journey.dto";
import JourneyChoiceOption from "./JourneyChoiceOption.vue";
import {useDashboardConfigStore} from "../../../store/dashboardConfig.store";
import {useJourneySelectionStore} from "../../../store/journeySelection.store";
import {getJourneyLabelDetails, getJourneyLabelText} from "../../../journeys/journeyLabels";
import JourneyPredictionExplanation from "./JourneyPredictionExplanation.vue";
import JourneyForm from "./JourneyForm.vue";
import JourneyLabel from "../JourneyLabel.vue";

const newJourneyOptionId = "__new-journey__";

const journeySelectionStore = useJourneySelectionStore();
const dashboardConfigStore = useDashboardConfigStore();
const {
    activeJourneyId,
    activeJourney,
    activeJourneyDetails,
    currentJourneyPrediction,
    journeyChoices,
} = storeToRefs(journeySelectionStore);
const {config} = storeToRefs(dashboardConfigStore);

const formMode = ref<"create" | "edit">();
const stationGroups = computed(() => config.value.stationGroups);
const scheduledJourneyIds = computed(
    () => new Set(config.value.schedules.map((schedule) => schedule.journeyId))
);
const canEditActiveJourney = computed(
    () =>
        activeJourneyDetails.value !== undefined &&
        !scheduledJourneyIds.value.has(activeJourneyDetails.value.id)
);
const activeJourneyEndpointMode = computed(() =>
    activeJourneyDetails.value?.origin.groupId !== undefined ||
    activeJourneyDetails.value?.destination.groupId !== undefined
        ? "locations"
        : "stations"
);
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
        formMode.value = "create";
        return;
    }

    formMode.value = undefined;
    journeySelectionStore.selectJourney(journeyId);
}

function submitJourney(journey: JourneyFields): void {
    if (formMode.value === "edit") journeySelectionStore.editActiveJourney(journey);
    else journeySelectionStore.selectEphemeralJourney(journey);
    formMode.value = undefined;
}
</script>
