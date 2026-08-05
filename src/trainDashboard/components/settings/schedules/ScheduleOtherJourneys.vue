<template>
    <section class="space-y-3 border-t border-line pt-5">
        <h3 class="font-semibold text-secondary">Other journeys</h3>

        <p
            v-if="selectedJourneyEntries.length === 0"
            class="text-sm text-ink-subtle"
        >
            No other journeys are selected.
        </p>

        <ul v-else class="divide-y divide-line">
            <li
                v-for="entry in selectedJourneyEntries"
                :key="entry.journey.id"
                class="space-y-3 py-3 first:pt-0"
            >
                <div class="flex flex-wrap items-center justify-between gap-3">
                    <span class="min-w-0 grow truncate">
                        <JourneyLabel
                            v-if="
                                hasJourneyEndpoints(
                                    entry.journey,
                                    stationGroups
                                )
                            "
                            :details="
                                getJourneyLabelDetails(
                                    entry.journey,
                                    stationGroups
                                )
                            "
                        />
                        <template v-else>New journey</template>
                    </span>
                    <span class="flex shrink-0 gap-2">
                        <button
                            class="appButton appButton--secondary px-3 py-1 text-sm"
                            type="button"
                            @click="toggleJourneyEditor(entry.journey.id)"
                        >
                            {{
                                editingJourneyId === entry.journey.id
                                    ? "Done"
                                    : "Edit journey"
                            }}
                        </button>
                        <button
                            class="appButton appButton--quiet px-2 py-1 text-sm text-danger hover:text-danger-dark"
                            type="button"
                            @click="emit('removeJourney', entry.journey.id)"
                        >
                            Remove
                        </button>
                    </span>
                </div>

                <div
                    v-if="editingJourneyId === entry.journey.id"
                    class="border-l-2 border-secondary pl-3"
                >
                    <JourneySettingsFields
                        v-model:journey="journeys[entry.index]!"
                        :stationGroups="stationGroups"
                        :journeys="journeys"
                        :scheduleNames="
                            getScheduleNamesUsingJourney(
                                entry.journey.id,
                                schedules
                            )
                        "
                        :canRemove="false"
                        @changed="emit('changed')"
                    />
                </div>
            </li>
        </ul>

        <button
            v-if="!isAddingJourney"
            class="appButton appButton--secondary"
            type="button"
            @click="isAddingJourney = true"
        >
            <AppIcon class="size-4" name="plus" />
            Add journey
        </button>

        <div v-else class="space-y-3 border-l-2 border-secondary pl-3">
            <label v-if="availableJourneys.length" class="block">
                <span class="mb-1 block text-xs text-ink-subtle">
                    Use an existing journey
                </span>
                <select v-model="selectedJourneyId" class="appInput">
                    <option value="">Choose a journey</option>
                    <option
                        v-for="journey in availableJourneys"
                        :key="journey.id"
                        :value="journey.id"
                    >
                        {{ getJourneySettingsLabel(journey, stationGroups) }}
                    </option>
                </select>
            </label>
            <div class="flex flex-wrap gap-2">
                <button
                    v-if="availableJourneys.length"
                    class="appButton appButton--primary px-3 py-1.5"
                    type="button"
                    :disabled="selectedJourneyId === ''"
                    @click="addSelectedJourney"
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
                    @click="isAddingJourney = false"
                >
                    Cancel
                </button>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import {computed, ref} from "vue";
import AppIcon from "@/components/AppIcon.vue";
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
const isAddingJourney = ref(false);
const selectedJourneyId = ref("");
const editingJourneyId = ref<string>();

const emit = defineEmits<{
    changed: [];
    removeJourney: [journeyId: string];
}>();

const selectedJourneyEntries = computed(() =>
    schedule.value.secondaryJourneyIds.flatMap((journeyId) => {
        const index = journeys.value.findIndex(
            (journey) => journey.id === journeyId
        );

        return index === -1 ? [] : [{journey: journeys.value[index]!, index}];
    })
);
const availableJourneys = computed(() =>
    journeys.value.filter(
        (journey) =>
            journey.id !== schedule.value.primaryJourneyId &&
            !schedule.value.secondaryJourneyIds.includes(journey.id) &&
            hasJourneyEndpoints(journey, props.stationGroups)
    )
);

function addSelectedJourney(): void {
    if (!selectedJourneyId.value) {
        return;
    }

    schedule.value.secondaryJourneyIds.push(selectedJourneyId.value);
    selectedJourneyId.value = "";
    isAddingJourney.value = false;
    emit("changed");
}

function createJourney(): void {
    const journey = createEmptyJourney();
    journeys.value = [...journeys.value, journey];
    schedule.value.secondaryJourneyIds = [
        ...schedule.value.secondaryJourneyIds,
        journey.id,
    ];
    isAddingJourney.value = false;
    emit("changed");
    editingJourneyId.value = journey.id;
}

function toggleJourneyEditor(journeyId: string): void {
    editingJourneyId.value =
        editingJourneyId.value === journeyId ? undefined : journeyId;
}
</script>
