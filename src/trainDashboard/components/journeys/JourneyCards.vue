<template>
    <div class="space-y-2">
        <article
            v-for="journey in journeys"
            :key="journey.id"
            class="rounded-lg border-l-4 py-3"
            :class="[
                journey.recommended ? 'bg-highlight' : 'bg-surface',
                flush ? 'rounded-none px-4' : 'px-3',
            ]"
            :style="{borderLeftColor: stationColour(journey.origin)}"
        >
            <h3 class="sr-only">{{ journey.contextLabel }}</h3>
            <p
                v-if="journey.recommended || journey.id === mustLeaveJourneyId"
                class="mb-2 flex items-center gap-1 text-xs font-bold text-danger"
            >
                <AppIcon class="size-3.5" name="clock" />
                {{ getMustLeaveMessage(journey, currentMinutes) }}
            </p>
            <p
                v-if="!journey.walkingTimesKnown"
                class="mb-2 text-xs text-ink-subtle"
            >
                Walking time is not configured for this journey.
            </p>
            <JourneyItinerary :journey="journey" />
        </article>
    </div>
</template>

<script setup lang="ts">
import AppIcon from "@/components/AppIcon.vue";
import type {TimetabledJourney} from "../../dto/timetabledJourney.dto";
import {getMustLeaveMessage} from "../../journeys/journeyTimes";
import {stationColour} from "../../stations/stationColours";
import JourneyItinerary from "./JourneyItinerary.vue";

defineProps<{
    journeys: TimetabledJourney[];
    currentMinutes: number;
    mustLeaveJourneyId?: string;
    flush?: boolean;
}>();
</script>
