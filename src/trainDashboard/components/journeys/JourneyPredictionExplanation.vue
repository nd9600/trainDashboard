<template>
    <p
        v-if="explanation"
        class="text-xs text-ink-subtle"
        data-test="prediction-explanation"
    >
        {{ explanation }}
    </p>
</template>

<script setup lang="ts">
import {computed} from "vue";
import type {JourneyPrediction} from "../../journeys/journeyPrediction";
import {useDashboardConfigStore} from "../../store/dashboardConfig.store";

const props = defineProps<{
    prediction: JourneyPrediction;
    isPredicted: boolean;
}>();
const configStore = useDashboardConfigStore();
const explanation = computed(() => {
    const {reason, nearbyStationGroupId} = props.prediction;
    const group = configStore.config.stationGroups.find(
        (group) => group.id === nearbyStationGroupId
    );

    const location = group ? `We think you are near ${group.name}.` : "";
    if (!props.isPredicted || !reason) {
        return location;
    }

    if (reason.type === "nearby") {
        return `${location} Choose a journey below.`;
    }

    if (reason.type === "saved") {
        return group
            ? `${location} This is your ${reason.onlyJourney ? "only" : "first"} saved journey from ${group.name}.`
            : location;
    }

    const schedule = configStore.config.schedules.find(
        (schedule) => schedule.id === reason.scheduleId
    );

    if (!schedule) {
        return location;
    }

    if (!group) {
        return `Selected by your “${schedule.name}” schedule.`;
    }

    return reason.timing === "active"
        ? `${location} Your “${schedule.name}” schedule selects this journey.`
        : `${location} “${schedule.name}” is your next schedule from ${group.name}.`;
});
</script>
