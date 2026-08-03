<template>
    <details class="group border-t border-line pt-4">
        <summary class="flex cursor-pointer list-none items-center gap-3">
            <AppIcon
                class="size-3.5 shrink-0 transition-transform group-open:rotate-90"
                name="chevron"
            />
            <strong class="text-sm text-secondary">
                Other journeys ({{ secondaryJourneyEntries.length }})
            </strong>
        </summary>

        <div class="mt-4 space-y-4 pl-6">
            <p
                v-if="secondaryJourneyEntries.length === 0"
                class="text-sm text-ink-subtle"
            >
                No other journeys are selected.
            </p>

            <details
                v-for="entry in secondaryJourneyEntries"
                :key="entry.journey.id"
                class="group/journey border-b border-line pb-3"
                :open="entry.journey.id === newJourneyId"
                @toggle="updateNewJourneyOpenState(entry.journey.id, $event)"
            >
                <summary
                    class="flex cursor-pointer list-none items-start gap-2"
                >
                    <AppIcon
                        class="mt-1 size-3 shrink-0 transition-transform group-open/journey:rotate-90"
                        name="chevron"
                    />
                    <span class="min-w-0 truncate">
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
                </summary>

                <div class="mt-3 pl-5">
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
                        @changed="emit('changed')"
                        @remove="emit('removeJourney', entry.journey.id)"
                    />
                </div>
            </details>

            <div
                v-if="availableSecondaryJourneys.length"
                class="flex flex-wrap items-center gap-2"
            >
                <select
                    v-model="selectedExistingJourneyId"
                    class="appInput min-w-52 grow text-xs sm:text-base"
                    aria-label="Existing Other journey"
                >
                    <option value="">Choose an existing journey</option>
                    <option
                        v-for="journey in availableSecondaryJourneys"
                        :key="journey.id"
                        :value="journey.id"
                    >
                        {{ getJourneySettingsLabel(journey, stationGroups) }}
                    </option>
                </select>
                <button
                    class="appButton appButton--secondary"
                    type="button"
                    :disabled="selectedExistingJourneyId === ''"
                    @click="addExistingSecondaryJourney"
                >
                    Add existing journey
                </button>
            </div>

            <button
                class="appButton appButton--primary"
                type="button"
                :disabled="stationGroups.length < 2"
                @click="createSecondaryJourney"
            >
                <AppIcon class="size-4" name="plus" />
                Add another journey to this schedule
            </button>
        </div>
    </details>
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
const selectedExistingJourneyId = ref("");
const newJourneyId = ref<string>();

const emit = defineEmits<{
    changed: [];
    removeJourney: [journeyId: string];
}>();

const secondaryJourneyEntries = computed(() =>
    journeys.value
        .map((journey, index) => ({journey, index}))
        .filter(({journey}) =>
            schedule.value.secondaryJourneyIds.includes(journey.id)
        )
);
const availableSecondaryJourneys = computed(() =>
    journeys.value.filter(
        (journey) =>
            hasJourneyEndpoints(journey, props.stationGroups) &&
            journey.id !== schedule.value.primaryJourneyId &&
            !schedule.value.secondaryJourneyIds.includes(journey.id)
    )
);

function addExistingSecondaryJourney(): void {
    if (!selectedExistingJourneyId.value) {
        return;
    }

    schedule.value.secondaryJourneyIds.push(selectedExistingJourneyId.value);
    selectedExistingJourneyId.value = "";
    emit("changed");
}

function createSecondaryJourney(): void {
    const journey = createEmptyJourney();
    newJourneyId.value = journey.id;
    schedule.value.secondaryJourneyIds = [
        ...schedule.value.secondaryJourneyIds,
        journey.id,
    ];
    journeys.value = [...journeys.value, journey];
    emit("changed");
}

function updateNewJourneyOpenState(journeyId: string, event: Event): void {
    if (
        journeyId === newJourneyId.value &&
        !(event.target as HTMLDetailsElement).open
    ) {
        newJourneyId.value = undefined;
    }
}
</script>
