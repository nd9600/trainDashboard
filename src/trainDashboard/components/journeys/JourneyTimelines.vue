<template>
    <JourneyCards
        class="sm:hidden"
        :journeys="displayedJourneys"
        :currentMinutes="currentMinutes"
        :mustLeaveJourneyId="mustLeaveJourneyId"
        :flush="flushOnMobile"
    />
    <JourneyCharts
        class="hidden sm:grid"
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
import {getJourneyTimelineRange} from "../../journeys/journeyTimes";
import JourneyCards from "./JourneyCards.vue";
import JourneyCharts from "./JourneyCharts.vue";

const props = defineProps<{
    journeys: TimetabledJourney[];
    currentMinutes: number;
    mustLeaveJourneyId?: string;
    flushOnMobile?: boolean;
}>();

const displayedJourneys = computed(() => props.journeys.slice(0, 6));
const timelineRange = computed(() =>
    getJourneyTimelineRange(displayedJourneys.value, props.currentMinutes)
);
const timelineStart = computed(() => timelineRange.value.start);
const timelineEnd = computed(() => timelineRange.value.end);
</script>
