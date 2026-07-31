<template>
    <JourneyCards
        :journeys="displayedJourneys"
        :currentMinutes="currentMinutes"
        :mustLeaveJourneyId="mustLeaveJourneyId"
    />
    <JourneyChart
        :journeys="displayedJourneys"
        :currentMinutes="currentMinutes"
        :mustLeaveJourneyId="mustLeaveJourneyId"
        :windowStart="timelineStart"
        :windowEnd="timelineEnd"
    />
</template>

<script setup lang="ts">
import {computed} from "vue";
import type {TimetabledJourney} from "../../dto/timetabledJourney.dto";
import {journeyTimelineRange} from "../../presentation/journeyPresentation";
import JourneyCards from "./JourneyCards.vue";
import JourneyChart from "./JourneyChart.vue";

const props = defineProps<{
    journeys: TimetabledJourney[];
    currentMinutes: number;
    mustLeaveJourneyId?: string;
}>();

const displayedJourneys = computed(() => props.journeys.slice(0, 6));
const timelineRange = computed(() =>
    journeyTimelineRange(displayedJourneys.value, props.currentMinutes)
);
const timelineStart = computed(() => timelineRange.value.start);
const timelineEnd = computed(() => timelineRange.value.end);
</script>
