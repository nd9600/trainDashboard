<template>
    <JourneyCards
        :journeys="displayedJourneys"
        :now="now"
        :mustLeaveJourneyId="mustLeaveJourneyId"
    />
    <JourneyChart
        :journeys="displayedJourneys"
        :now="now"
        :mustLeaveJourneyId="mustLeaveJourneyId"
        :windowStart="timelineStart"
        :windowEnd="timelineEnd"
    />
</template>

<script setup lang="ts">
import {computed} from "vue";
import type {Journey} from "../../dto/journey.dto";
import {journeyTimelineRange} from "../../presentation/journeyPresentation";
import JourneyCards from "./JourneyCards.vue";
import JourneyChart from "./JourneyChart.vue";

const props = defineProps<{
    journeys: Journey[];
    now: number;
    mustLeaveJourneyId?: string;
}>();

const displayedJourneys = computed(() => props.journeys.slice(0, 6));
const timelineRange = computed(() =>
    journeyTimelineRange(displayedJourneys.value, props.now)
);
const timelineStart = computed(() => timelineRange.value.start);
const timelineEnd = computed(() => timelineRange.value.end);
</script>
