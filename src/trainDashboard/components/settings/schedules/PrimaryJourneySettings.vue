<template>
    <details class="group border-t border-line pt-4">
        <summary class="flex cursor-pointer list-none items-start gap-3">
            <AppIcon
                class="mt-1 size-3.5 shrink-0 transition-transform group-open:rotate-90"
                name="chevron"
            />
            <span class="min-w-0">
                <strong class="block text-sm text-primary">
                    Primary journey
                </strong>
                <span class="block truncate">
                    <JourneyLabel
                        v-if="primaryJourneyIsComplete"
                        :details="
                            getJourneyLabelDetails(
                                primaryJourneyEntry!.journey,
                                stationGroups
                            )
                        "
                    />
                    <template v-else>Choose or create a journey</template>
                </span>
            </span>
        </summary>

        <div class="mt-4 space-y-3 sm:pl-6">
            <label class="block">
                <span class="mb-1 block text-xs text-ink-subtle">
                    Use an existing journey as the primary
                </span>
                <select
                    class="appInput text-xs sm:text-base"
                    :value="schedule.primaryJourneyId"
                    required
                    @change="changePrimaryJourney"
                >
                    <option disabled value="">Choose a primary journey</option>
                    <option
                        v-for="journey in selectablePrimaryJourneys"
                        :key="journey.id"
                        :value="journey.id"
                    >
                        {{ getJourneySettingsLabel(journey, stationGroups) }}
                    </option>
                </select>
            </label>

            <JourneySettingsFields
                v-if="primaryJourneyEntry"
                v-model:journey="journeys[primaryJourneyEntry.index]!"
                :stationGroups="stationGroups"
                :journeys="journeys"
                :scheduleNames="
                    getScheduleNamesUsingJourney(
                        primaryJourneyEntry.journey.id,
                        schedules
                    )
                "
                :canRemove="false"
                @changed="emit('changed')"
            />

            <button
                v-if="!primaryJourneyEntry"
                class="appButton appButton--secondary"
                type="button"
                :disabled="stationGroups.length < 2"
                @click="createPrimaryJourney"
            >
                <AppIcon class="size-4" name="plus" />
                Create a primary journey
            </button>
        </div>
    </details>
</template>

<script setup lang="ts">
import {computed} from "vue";
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

const emit = defineEmits<{
    changed: [];
}>();

const primaryJourneyEntry = computed(() => {
    const index = journeys.value.findIndex(
        (journey) => journey.id === schedule.value.primaryJourneyId
    );

    return index === -1 ? undefined : {journey: journeys.value[index]!, index};
});
const primaryJourneyIsComplete = computed(
    () =>
        primaryJourneyEntry.value !== undefined &&
        hasJourneyEndpoints(
            primaryJourneyEntry.value.journey,
            props.stationGroups
        )
);
const selectablePrimaryJourneys = computed(() =>
    journeys.value.filter((journey) =>
        hasJourneyEndpoints(journey, props.stationGroups)
    )
);

function changePrimaryJourney(event: Event): void {
    setPrimaryJourney((event.target as HTMLSelectElement).value);
}

function setPrimaryJourney(journeyId: string, emitChange = true): void {
    const previousPrimaryJourneyId = schedule.value.primaryJourneyId;

    if (journeyId === previousPrimaryJourneyId) {
        return;
    }

    schedule.value.secondaryJourneyIds =
        schedule.value.secondaryJourneyIds.filter(
            (candidate) => candidate !== journeyId
        );

    if (
        journeys.value.some(
            (journey) => journey.id === previousPrimaryJourneyId
        ) &&
        !schedule.value.secondaryJourneyIds.includes(previousPrimaryJourneyId)
    ) {
        schedule.value.secondaryJourneyIds.push(previousPrimaryJourneyId);
    }

    schedule.value.primaryJourneyId = journeyId;

    if (emitChange) {
        emit("changed");
    }
}

function createPrimaryJourney(): void {
    const journey = createEmptyJourney();
    setPrimaryJourney(journey.id, false);
    journeys.value = [...journeys.value, journey];
    emit("changed");
}
</script>
