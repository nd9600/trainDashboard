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

const props = defineProps<{ prediction: JourneyPrediction }>();
const configStore = useDashboardConfigStore();
const explanation = computed(() => {
    const {reason, nearbyStationGroupId} = props.prediction;
    if (!reason) {
        return ""
    }

    const group = configStore.config.stationGroups.find(
        (group) => group.id === nearbyStationGroupId
    );

    const location = group
        ? `We think you are near ${group.name}.`
        : "";
    if (reason.type === "nearby") {
        return location
    }

    if (reason.type === "saved") {
        return `${location} This is ${reason.onlyJourney ? "your only" : "the first"} saved journey from there.`;
    }

    const schedule = configStore.config.schedules.find(
        (schedule) => schedule.id === reason.scheduleId
    );

    if (!schedule) {
        return location
    }

    if (!group) {
        return `Selected by your “${schedule.name}” schedule.`
    }

    return reason.timing === "active"
        ? `${location} Your “${schedule.name}” schedule selects this journey.`
        : `${location} “${schedule.name}” is your next schedule from there.`;
});
</script>
