<template>
    <section class="space-y-3 border-t border-line pt-5">
        <h3 class="font-semibold text-primary">Primary journey</h3>

        <div
            class="flex items-center justify-between gap-3 rounded-lg bg-surface-muted p-3"
        >
            <span class="min-w-0 grow truncate">
                <JourneyLabel
                    v-if="primaryJourneyIsComplete"
                    :details="
                        getJourneyLabelDetails(primaryJourney!, stationGroups)
                    "
                />
                <template v-else>Choose a primary journey</template>
            </span>
            <button
                v-if="primaryJourney"
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
                    : "Change primary journey"
            }}
        </button>

        <div
            v-if="isEditingJourney && primaryJourneyIndex !== -1"
            class="space-y-3 border-l-2 border-primary pl-3"
        >
            <h4 class="text-sm font-semibold">Edit primary journey</h4>
            <JourneySettingsFields
                v-model:journey="journeys[primaryJourneyIndex]!"
                :stationGroups="stationGroups"
                :journeys="journeys"
                :scheduleNames="
                    getScheduleNamesUsingJourney(primaryJourney!.id, schedules)
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

const primaryJourney = computed(() =>
    journeys.value.find(
        (journey) => journey.id === schedule.value.primaryJourneyId
    )
);
const primaryJourneyIsComplete = computed(
    () =>
        primaryJourney.value !== undefined &&
        hasJourneyEndpoints(primaryJourney.value, props.stationGroups)
);
const primaryJourneyIndex = computed(() =>
    journeys.value.findIndex(
        (journey) => journey.id === schedule.value.primaryJourneyId
    )
);
const selectableJourneys = computed(() =>
    journeys.value.filter(
        (journey) =>
            journey.id !== schedule.value.primaryJourneyId &&
            hasJourneyEndpoints(journey, props.stationGroups)
    )
);

function useSelectedJourney(): void {
    if (!selectedJourneyId.value) {
        return;
    }

    setPrimaryJourney(selectedJourneyId.value);
    selectedJourneyId.value = "";
    isChangingJourney.value = false;
    isEditingJourney.value = false;
}

function setPrimaryJourney(journeyId: string): void {
    const previousPrimaryJourney = primaryJourney.value;

    schedule.value.secondaryJourneyIds =
        schedule.value.secondaryJourneyIds.filter(
            (candidate) => candidate !== journeyId
        );

    if (
        previousPrimaryJourney &&
        hasJourneyEndpoints(previousPrimaryJourney, props.stationGroups) &&
        !schedule.value.secondaryJourneyIds.includes(previousPrimaryJourney.id)
    ) {
        schedule.value.secondaryJourneyIds.push(previousPrimaryJourney.id);
    }

    schedule.value.primaryJourneyId = journeyId;
    removeUnusedIncompleteJourney(previousPrimaryJourney);
    emit("changed");
}

function createJourney(): void {
    const journey = createEmptyJourney();
    journeys.value = [...journeys.value, journey];
    setPrimaryJourney(journey.id);
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
                (candidate.primaryJourneyId === journey.id ||
                    candidate.secondaryJourneyIds.includes(journey.id))
        )
    ) {
        return;
    }

    journeys.value = journeys.value.filter(
        (candidate) => candidate.id !== journey.id
    );
}
</script>
