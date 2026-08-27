<template>
    <button
        class="flex w-full items-center justify-between gap-4 rounded-lg border border-line bg-paper p-4 text-left shadow-sm transition-colors hover:border-primary hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        type="button"
        @click="emit('edit')"
    >
        <span class="min-w-0">
            <strong class="block truncate">
                {{ schedule.name || "Unnamed schedule" }}
            </strong>
            <span class="block text-xs text-ink-subtle">
                {{ getActiveDaysText(schedule.days) }} ·
                {{ schedule.startsAt }}–{{ schedule.endsAt }}
            </span>
            <span
                v-if="selectedJourneyIsComplete"
                class="mt-2 block truncate text-sm"
            >
                <span class="text-ink-subtle">Journey: </span>
                <JourneyLabel
                    :details="
                        getJourneyLabelDetails(selectedJourney!, stationGroups)
                    "
                />
            </span>
            <span v-else class="mt-2 block text-sm text-danger-dark">
                Choose a journey.
            </span>
        </span>

        <AppIcon class="size-4" name="chevron" />
    </button>
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
import {getActiveDaysText, hasJourneyEndpoints} from "./scheduleSettings";

const props = defineProps<{
    schedule: DisplaySchedule;
    journeys: Journey[];
    stationGroups: StationGroup[];
}>();

const emit = defineEmits<{
    edit: [];
}>();

const selectedJourney = computed(() =>
    props.journeys.find(
        (journey) => journey.id === props.schedule.journeyId
    )
);
const selectedJourneyIsComplete = computed(
    () =>
        selectedJourney.value !== undefined &&
        hasJourneyEndpoints(selectedJourney.value, props.stationGroups)
);
</script>
