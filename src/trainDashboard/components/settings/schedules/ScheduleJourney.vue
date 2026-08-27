<template>
    <section class="space-y-3 border-t border-line pt-5">
        <h3 class="font-semibold text-primary">Journey</h3>

        <div
            class="flex items-center justify-between gap-3 rounded-lg bg-surface-muted p-3"
        >
            <span class="min-w-0 grow truncate">
                <JourneyLabel
                    v-if="selectedJourneyIsComplete"
                    :details="
                        getJourneyLabelDetails(selectedJourney!, stationGroups)
                    "
                />
                <template v-else>Choose a journey</template>
            </span>
            <button
                v-if="selectedJourney"
                class="appButton appButton--secondary shrink-0 px-3 py-1 text-sm"
                type="button"
                @click="toggleJourneyEditor"
            >
                {{ isEditingJourney ? "Done" : "Edit journey" }}
            </button>
        </div>

        <button
            class="appButton appButton--quiet px-0 py-1 text-sm text-primary underline underline-offset-2"
            type="button"
            @click="toggleJourneyPicker"
        >
            {{
                isChangingJourney
                    ? "Hide journey choices"
                    : "Change journey"
            }}
        </button>

        <div
            v-if="isEditingJourney && selectedJourneyIndex !== -1"
            class="space-y-3 border-l-2 border-primary pl-3"
        >
            <h4 class="text-sm font-semibold">Edit journey</h4>
            <JourneySettingsFields
                v-model:journey="journeys[selectedJourneyIndex]!"
                :stationGroups="stationGroups"
                :journeys="journeys"
                :scheduleNames="
                    getScheduleNamesUsingJourney(selectedJourney!.id, schedules)
                "
                :canRemove="false"
                @changed="emit('changed')"
            />
        </div>

        <div
            v-if="isChangingJourney"
            class="space-y-3 border-l-2 border-primary pl-3"
        >
            <label class="block">
                <span class="mb-1 block text-xs text-ink-subtle">
                    Use an existing journey
                </span>
                <select v-model="selectedJourneyId" class="appInput">
                    <option value="">Choose a journey</option>
                    <option
                        v-for="journey in selectableJourneys"
                        :key="journey.id"
                        :value="journey.id"
                    >
                        {{ getJourneySettingsLabel(journey, stationGroups) }}
                    </option>
                </select>
            </label>
            <div class="flex flex-wrap gap-2">
                <button
                    class="appButton appButton--primary px-3 py-1.5"
                    type="button"
                    :disabled="selectedJourneyId === ''"
                    @click="useSelectedJourney"
                >
                    Use journey
                </button>
                <button
                    class="appButton appButton--secondary px-3 py-1.5"
                    type="button"
                    @click="createJourney"
                >
                    Create a new journey
                </button>
                <button
                    class="appButton appButton--quiet px-2 py-1.5"
                    type="button"
                    @click="isChangingJourney = false"
                >
                    Cancel
                </button>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import {computed, ref} from "vue";
import type {
    DisplaySchedule,
    Journey,
    StationGroup,
} from "../../../dto/dashboardConfig.dto";
import {getJourneyLabelDetails} from "../../../journeys/journeyLabels";
import JourneyLabel from "../../journeys/JourneyLabel.vue";
import JourneySettingsFields from "../journeys/JourneySettingsFields.vue";
import {
    createEmptyJourney,
    getJourneySettingsLabel,
    getScheduleNamesUsingJourney,
    hasJourneyEndpoints,
} from "./scheduleSettings";

const props = defineProps<{
    stationGroups: StationGroup[];
    schedules: DisplaySchedule[];
}>();

const schedule = defineModel<DisplaySchedule>("schedule", {required: true});
const journeys = defineModel<Journey[]>("journeys", {required: true});
const isChangingJourney = ref(false);
const isEditingJourney = ref(false);
const selectedJourneyId = ref("");

const emit = defineEmits<{
    changed: [];
}>();

const selectedJourney = computed(() =>
    journeys.value.find(
        (journey) => journey.id === schedule.value.journeyId
    )
);
const selectedJourneyIsComplete = computed(
    () =>
        selectedJourney.value !== undefined &&
        hasJourneyEndpoints(selectedJourney.value, props.stationGroups)
);
const selectedJourneyIndex = computed(() =>
    journeys.value.findIndex(
        (journey) => journey.id === schedule.value.journeyId
    )
);
const selectableJourneys = computed(() =>
    journeys.value.filter(
        (journey) =>
            journey.id !== schedule.value.journeyId &&
            hasJourneyEndpoints(journey, props.stationGroups)
    )
);

function useSelectedJourney(): void {
    if (!selectedJourneyId.value) {
        return;
    }

    setJourney(selectedJourneyId.value);
    selectedJourneyId.value = "";
    isChangingJourney.value = false;
    isEditingJourney.value = false;
}

function setJourney(journeyId: string): void {
    const previousJourney = selectedJourney.value;

    schedule.value.journeyId = journeyId;
    removeUnusedIncompleteJourney(previousJourney);
    emit("changed");
}

function createJourney(): void {
    const journey = createEmptyJourney();
    journeys.value = [...journeys.value, journey];
    setJourney(journey.id);
    isChangingJourney.value = false;
    isEditingJourney.value = true;
}

function toggleJourneyPicker(): void {
    isChangingJourney.value = !isChangingJourney.value;

    if (isChangingJourney.value) {
        isEditingJourney.value = false;
    }
}

function toggleJourneyEditor(): void {
    isEditingJourney.value = !isEditingJourney.value;

    if (isEditingJourney.value) {
        isChangingJourney.value = false;
    }
}

function removeUnusedIncompleteJourney(journey: Journey | undefined): void {
    if (
        !journey ||
        hasJourneyEndpoints(journey, props.stationGroups) ||
        props.schedules.some(
            (candidate) =>
                candidate.id !== schedule.value.id &&
                candidate.journeyId === journey.id
        )
    ) {
        return;
    }

    journeys.value = journeys.value.filter(
        (candidate) => candidate.id !== journey.id
    );
}
</script>
