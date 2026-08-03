<template>
    <div class="relative grid-cols-[max-content_minmax(0,1fr)] gap-x-4">
        <div
            v-for="(journey, index) in journeys"
            :key="`highlight-${journey.id}`"
            class="pointer-events-none absolute inset-x-0 rounded-lg bg-highlight"
            :class="journey.recommended ? 'block' : 'hidden'"
            :style="{
                top: `${rowStart + index * rowGap - rowGap / 2 + rowMargin}px`,
                height: `${rowGap - rowMargin * 2}px`,
            }"
        />

        <div class="relative z-10">
            <div :style="{height: `${rowStart - rowGap / 2}px`}" />
            <JourneyChartSummary
                v-for="journey in journeys"
                :key="journey.id"
                :journey="journey"
                :currentMinutes="currentMinutes"
                :mustLeaveJourneyId="mustLeaveJourneyId"
                :height="rowGap"
            />
        </div>

        <JourneyChartSvg
            :journeys="journeys"
            :currentMinutes="currentMinutes"
            :windowStart="windowStart"
            :windowEnd="windowEnd"
            :rowStart="rowStart"
            :rowGap="rowGap"
        />
    </div>
</template>

<script setup lang="ts">
import type {TimetabledJourney} from "../../dto/timetabledJourney.dto";
import JourneyChartSummary from "./JourneyChartSummary.vue";
import JourneyChartSvg from "./JourneyChartSvg.vue";

defineProps<{
    journeys: TimetabledJourney[];
    currentMinutes: number;
    mustLeaveJourneyId?: string;
    windowStart: number;
    windowEnd: number;
}>();

const rowGap = 112;
const rowMargin = 4;
const rowStart = 55 + rowGap / 2;
</script>
