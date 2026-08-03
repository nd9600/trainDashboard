<template>
    <label
        class="grid gap-1 sm:grid-cols-[minmax(0,1fr)_minmax(12rem,16rem)] sm:items-center sm:gap-3"
    >
        <span class="min-w-0 font-medium">
            <JourneyLabel
                :details="getJourneyLabelDetails(journey, stationGroups)"
            />
            is
        </span>
        <select
            class="appInput min-w-0"
            :value="priority"
            @change="emitPriorityChange"
        >
            <option value="primary">the primary journey</option>
            <option value="secondary">a secondary journey</option>
            <option value="hidden">hidden</option>
        </select>
    </label>
</template>

<script setup lang="ts">
import type {Journey, StationGroup} from "../../../dto/dashboardConfig.dto";
import {getJourneyLabelDetails} from "../../../journeys/journeyLabels";
import JourneyLabel from "../../journeys/JourneyLabel.vue";

type JourneyPriority = "hidden" | "primary" | "secondary";

defineProps<{
    journey: Journey;
    stationGroups: StationGroup[];
    priority: JourneyPriority;
}>();

const emit = defineEmits<{
    priorityChange: [priority: JourneyPriority];
}>();

function emitPriorityChange(event: Event): void {
    emit(
        "priorityChange",
        (event.target as HTMLSelectElement).value as JourneyPriority
    );
}
</script>
