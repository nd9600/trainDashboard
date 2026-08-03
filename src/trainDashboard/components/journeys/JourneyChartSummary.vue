<template>
    <div
        class="flex max-w-96 items-center gap-2 px-2"
        :style="{height: `${height}px`}"
    >
        <div class="min-w-0">
            <JourneyDesktopItinerary :journey="journey" />
            <span
                v-if="journey.recommended || journey.id === mustLeaveJourneyId"
                class="mt-1 flex items-center gap-1 text-xs font-bold text-danger"
            >
                <AppIcon class="size-3.5" name="clock" />
                {{ getMustLeaveMessage(journey, currentMinutes) }}
            </span>
        </div>
    </div>
</template>

<script setup lang="ts">
import AppIcon from "@/components/AppIcon.vue";
import type {TimetabledJourney} from "../../dto/timetabledJourney.dto";
import {getMustLeaveMessage} from "../../journeys/journeyTimes";
import {stationColour} from "../../stations/stationColours";
import JourneyDesktopItinerary from "./JourneyDesktopItinerary.vue";

defineProps<{
    journey: TimetabledJourney;
    currentMinutes: number;
    mustLeaveJourneyId?: string;
    height: number;
}>();
</script>
