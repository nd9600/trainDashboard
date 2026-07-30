<template>
    <JourneyCards :journeys="journeys" :now="now" />
    <JourneyChart
        :journeys="journeys"
        :now="now"
        :windowStart="windowStart"
        :windowEnd="windowEnd"
    />
</template>

<script setup lang="ts">
import type {Journey} from "../../dto/journey.dto";
import JourneyCards from "./JourneyCards.vue";
import JourneyChart from "./JourneyChart.vue";

defineProps<{
    journeys: Journey[];
    now: number;
    windowStart: number;
    windowEnd: number;
}>();
</script>
