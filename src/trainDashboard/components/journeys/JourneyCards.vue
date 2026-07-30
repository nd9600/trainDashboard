<template>
    <div class="space-y-2 sm:hidden">
        <article
            v-for="journey in journeys"
            :key="journey.id"
            class="rounded-lg px-3 py-2.5"
            :class="journey.recommended ? 'bg-highlight' : 'bg-surface'"
        >
            <div class="flex items-start gap-2">
                <i
                    class="mt-1.5 size-2.5 shrink-0 rounded-full"
                    :style="{
                        backgroundColor: stationColour(journey.origin),
                    }"
                />
                <div class="min-w-0 grow">
                    <p
                        class="font-semibold"
                        :style="{color: stationColour(journey.origin)}"
                    >
                        {{ journey.label }}
                    </p>
                    <p class="mt-1 text-sm text-ink-muted">
                        {{
                            journey.arrivalLabel && journey.arrivalTime
                                ? journey.arrivalLabel
                                : "Train arrives"
                        }}
                        <strong
                            v-if="
                                journey.boldArrivalTime && journey.arrivalTime
                            "
                        >
                            {{ journey.arrivalTime }}
                        </strong>
                        <span v-else>
                            {{ journey.arrivalTime ?? journey.railArrivalTime }}
                        </span>
                    </p>
                    <p
                        v-if="journey.recommended"
                        class="mt-1 flex items-center gap-1 text-xs font-bold text-danger"
                    >
                        <AppIcon class="size-3.5" name="clock" />
                        {{ mustLeaveText(journey, now) }}
                    </p>
                </div>
            </div>
        </article>
    </div>
</template>

<script setup lang="ts">
import AppIcon from "@/components/AppIcon.vue";
import type {Journey} from "../../dto/journey.dto";
import {mustLeaveText} from "../../presentation/journeyPresentation";
import {stationColour} from "../../stations/stationColours";

defineProps<{
    journeys: Journey[];
    now: number;
}>();
</script>
