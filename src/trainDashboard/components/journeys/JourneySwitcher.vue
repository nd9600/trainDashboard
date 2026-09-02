<template>
    <Listbox
        :modelValue="activeJourneyId"
        as="div"
        class="relative mr-4 flex w-fit max-w-full flex-col items-start gap-2"
        @update:model-value="selectJourney"
    >
        <p
            v-if="activeSchedule || activeJourney.type !== 'predicted'"
            class="text-xs text-ink-subtle"
        >
            {{
                activeJourney.type === "predicted"
                    ? activeSchedule?.name
                    : "&nbsp;"
            }}
        </p>
        <div class="flex max-w-full items-center gap-1">
            <ListboxButton
                class="appButton appButton--secondary min-w-0 max-w-full justify-start whitespace-normal border-none p-1 text-left"
                :class="
                    activeJourneyDetails
                        ? undefined
                        : 'sr-only focus:not-sr-only focus:relative focus:m-1'
                "
                :aria-label="switcherButtonLabel"
                :disabled="isCreatingEphemeralJourney || isEditingJourney"
            >
                <JourneyLabel
                    v-if="activeJourneyDetails"
                    class="text-xs"
                    :details="
                        getJourneyLabelDetails(
                            activeJourneyDetails,
                            stationGroups
                        )
                    "
                    :shouldSayWhenDirect="false"
                />
                <span v-else>Choose a journey</span>
                <AppIcon class="size-3 rotate-90" name="chevron" />
            </ListboxButton>
            <button
                v-if="
                    activeJourney.type !== 'predicted' &&
                    !isCreatingEphemeralJourney &&
                    !isEditingJourney
                "
                class="appButton appButton--quiet appButton--icon size-7 shrink-0 text-ink-subtle"
                type="button"
                title="Clear temporary journey"
                aria-label="Clear temporary journey"
                @click="clearActiveJourney"
            >
                <AppIcon class="size-3.5" name="close" />
            </button>
        </div>

        <ListboxOptions
            :static="
                !activeJourneyDetails &&
                !isCreatingEphemeralJourney &&
                !isEditingJourney
            "
            class="z-20 max-h-[80vh] max-w-[calc(100vw-2rem)] overflow-y-auto rounded-lg border border-line-strong bg-paper shadow-lg focus:outline-none"
            :class="
                activeJourneyDetails
                    ? 'absolute top-full left-0 mt-1'
                    : undefined
            "
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
                        class="group flex cursor-pointer items-center gap-3 px-3 py-2 text-left transition-colors"
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
                        <button
                            v-if="canRemoveJourney(section.name, journey.id)"
                            class="ml-2 rounded-md px-2 py-2 cursor-pointer border-0 bg-inherit text-ink-subtle opacity-0 group-hover:opacity-100 hover:text-ink hover:bg-paper"
                            type="button"
                            tabindex="-1"
                            :title="getRemoveTitle(section.name)"
                            :aria-label="getRemoveTitle(section.name)"
                            @click.stop="removeJourney(section.name, journey.id)"
                        >
                            <AppIcon class="size-3.5" name="close" />
                        </button>
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

        <div
            v-if="
                activeJourney.type !== 'predicted' &&
                !isCreatingEphemeralJourney &&
                !isEditingJourney &&
                (activeJourney.type === 'ephemeral' || canEditActiveJourney)
            "
            class="flex items-center gap-2"
        >
            <button
                v-if="activeJourney.type === 'ephemeral'"
                class="appButton appButton--primary px-2 py-1 text-xs"
                type="button"
                @click="saveActiveJourney"
            >
                <AppIcon class="size-3.5" name="bookmark" />
                Save
            </button>
            <button
                v-if="canEditActiveJourney"
                class="appButton appButton--secondary px-2 py-1 text-xs"
                type="button"
                @click="isEditingJourney = true"
            >
                <AppIcon class="size-3.5" name="pencil" />
                Edit
            </button>
        </div>

        <JourneyForm
            v-if="isCreatingEphemeralJourney"
            @submit="useEphemeralJourney"
            @cancel="isCreatingEphemeralJourney = false"
        />
        <JourneyForm
            v-else-if="isEditingJourney && activeJourneyDetails"
            :key="activeJourneyDetails.id"
            :initialJourney="activeJourneyDetails"
            :endpointMode="activeJourneyEndpointMode"
            :stationGroups="stationGroups"
            :journeys="config.journeys"
            submitLabel="Save"
            @submit="editActiveJourney"
            @cancel="isEditingJourney = false"
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
import type {JourneyChoices} from "../../dto/journeySelection.dto";
import {useDashboardConfigStore} from "../../store/dashboardConfig.store";
import {useJourneySelectionStore} from "../../store/journeySelection.store";
import {
    getJourneyLabelDetails,
    getJourneyLabelText,
} from "../../journeys/journeyLabels";
import JourneyForm from "./JourneyForm.vue";
import JourneyLabel from "./JourneyLabel.vue";

const newJourneyOptionId = "__new-journey__";

const journeySelectionStore = useJourneySelectionStore();
const dashboardConfigStore = useDashboardConfigStore();
const {
    activeJourneyId,
    activeJourney,
    activeJourneyDetails,
    activeSchedule,
    journeyChoices,
} = storeToRefs(journeySelectionStore);
const {config} = storeToRefs(dashboardConfigStore);

const isCreatingEphemeralJourney = ref(false);
const isEditingJourney = ref(false);
const stationGroups = computed(() => config.value.stationGroups);
const scheduledJourneyIds = computed(
    () => new Set(config.value.schedules.map((schedule) => schedule.journeyId))
);
const canEditActiveJourney = computed(
    () =>
        activeJourneyDetails.value !== undefined &&
        !scheduledJourneyIds.value.has(activeJourneyDetails.value.id)
);
const activeJourneyEndpointMode = computed<"locations" | "stations">(() => {
    const journey = activeJourneyDetails.value;

    if (
        journey &&
        (journey.origin.groupId !== undefined ||
            journey.destination.groupId !== undefined)
    ) {
        return "locations";
    }

    return "stations";
});
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
    isEditingJourney.value = false;
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

function editActiveJourney(journey: JourneyFields): void {
    if (!journeySelectionStore.editActiveJourney(journey)) {
        return;
    }

    isEditingJourney.value = false;
}

function canRemoveJourney(
    sectionName: JourneyChoices["name"],
    journeyId: string
): boolean {
    return (
        sectionName === "Recent" ||
        (sectionName === "Saved" && !scheduledJourneyIds.value.has(journeyId))
    );
}

function getRemoveTitle(sectionName: JourneyChoices["name"]): string {
    return sectionName === "Recent"
        ? "Remove from recent journeys"
        : "Remove saved journey";
}

function removeJourney(
    sectionName: JourneyChoices["name"],
    journeyId: string
): void {
    if (sectionName === "Recent") {
        journeySelectionStore.removeRecentJourney(journeyId);
        return;
    }

    if (sectionName === "Saved") {
        journeySelectionStore.removeSavedJourney(journeyId);
    }
}

function clearActiveJourney(): void {
    journeySelectionStore.clearActiveJourney();
}
</script>
