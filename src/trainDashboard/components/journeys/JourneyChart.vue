<template>
    <div
        class="relative hidden grid-cols-[max-content_minmax(0,1fr)] gap-x-4 sm:grid"
    >
        <div
            v-for="(journey, index) in journeys"
            :key="`highlight-${journey.id}`"
            class="pointer-events-none absolute inset-x-0 rounded-lg bg-highlight"
            :class="journey.recommended ? 'block' : 'hidden'"
            :style="{
                top: `${rowStart + index * rowGap - 32}px`,
                height: '64px',
            }"
        />

        <div class="relative z-10">
            <div :style="{height: `${rowStart - rowGap / 2}px`}" />
            <div
                v-for="journey in journeys"
                :key="journey.id"
                class="flex items-center gap-2 whitespace-nowrap pr-2 text-sm font-semibold"
                :style="{
                    height: `${rowGap}px`,
                    color: stationColour(journey.origin),
                }"
            >
                <i
                    class="size-2.5 shrink-0 rounded-full"
                    :style="{
                        backgroundColor: stationColour(journey.origin),
                    }"
                />
                <div class="leading-tight">
                    <JourneyRouteLabel :journey="journey" />
                    <span
                        v-if="
                            journey.recommended ||
                            journey.id === mustLeaveJourneyId
                        "
                        class="mt-1 flex items-center gap-1 text-xs font-bold text-danger"
                    >
                        <AppIcon class="size-3.5" name="clock" />
                        {{ mustLeaveText(journey, currentMinutes) }}
                    </span>
                    <JourneyNationalRailLink class="mt-1" :journey="journey" />
                </div>
            </div>
        </div>

        <svg
            class="relative z-10 block w-full overflow-visible"
            width="100%"
            :height="chartHeight"
            role="img"
            aria-label="Comparison of possible train journeys"
        >
            <rect
                class="fill-surface-muted"
                x="0"
                y="45"
                :width="xAt(currentMinutes)"
                :height="chartBottom - 45"
            />

            <g v-for="tick in ticks" :key="tick">
                <line
                    class="stroke-line [stroke-width:1]"
                    :x1="xAt(tick)"
                    y1="45"
                    :x2="xAt(tick)"
                    :y2="chartBottom"
                />
                <text
                    class="fill-ink-subtle text-xs"
                    :x="xAt(tick)"
                    y="32"
                    text-anchor="middle"
                >
                    {{ formatTime(tick) }}
                </text>
            </g>

            <g
                v-for="(journey, index) in journeys"
                :key="journey.id"
                :transform="`translate(0 ${rowStart + index * rowGap})`"
            >
                <line
                    v-for="(segment, segmentIndex) in orderedSegments(journey)"
                    :key="segmentIndex"
                    :class="segmentClasses[segment.kind]"
                    :style="{
                        stroke: stationColour(journey.origin),
                        strokeOpacity: segment.kind === 'walk' ? 0.55 : 1,
                    }"
                    :x1="xAt(segment.start)"
                    y1="0"
                    :x2="xAt(segment.end)"
                    y2="0"
                    stroke-linecap="round"
                />
            </g>

            <line
                class="stroke-danger [stroke-width:2]"
                :x1="xAt(currentMinutes)"
                y1="45"
                :x2="xAt(currentMinutes)"
                :y2="chartBottom"
            />

            <g
                v-for="(journey, index) in journeys"
                :key="`labels-${journey.id}`"
                :transform="`translate(0 ${rowStart + index * rowGap})`"
            >
                <template
                    v-for="(leg, legIndex) in journey.trainLegs.slice(0, -1)"
                    :key="`connection-${legIndex}`"
                >
                    <text
                        :class="timelineLabelClasses(journey)"
                        :x="xAt(leg.arrival)"
                        dx="-6"
                        y="-12"
                        text-anchor="end"
                    >
                        {{ formatTime(leg.arrival) }}a
                    </text>
                    <text
                        :class="timelineLabelClasses(journey)"
                        :x="xAt(journey.trainLegs[legIndex + 1]!.departure)"
                        dx="6"
                        y="-12"
                        text-anchor="start"
                    >
                        d{{
                            formatTime(
                                journey.trainLegs[legIndex + 1]!.departure
                            )
                        }}
                    </text>
                </template>
                <text
                    :class="timelineLabelClasses(journey)"
                    :x="xAt(journey.segments.at(-1)!.end)"
                    dx="10"
                    y="5"
                >
                    {{
                        journey.arrivalLabel && journey.arrivalTime
                            ? journey.arrivalLabel
                            : "Train arrives"
                    }}
                    <tspan
                        dx="4"
                        :class="
                            journey.boldArrivalTime ? 'font-bold' : undefined
                        "
                    >
                        {{ journey.arrivalTime ?? journey.railArrivalTime }}
                    </tspan>
                </text>
            </g>

            <text
                class="fill-danger text-xs"
                :x="xAt(currentMinutes)"
                :y="chartBottom + 17"
                text-anchor="middle"
            >
                now
            </text>
        </svg>
    </div>
</template>

<script setup lang="ts">
import {computed} from "vue";
import AppIcon from "@/components/AppIcon.vue";
import {formatTime} from "@/utilities/time.utility.ts";
import type {Journey, SegmentKind} from "../../dto/journey.dto";
import {mustLeaveText} from "../../presentation/journeyPresentation";
import {stationColour} from "../../stations/stationColours";
import JourneyNationalRailLink from "./JourneyNationalRailLink.vue";
import JourneyRouteLabel from "./JourneyRouteLabel.vue";

const props = defineProps<{
    journeys: Journey[];
    currentMinutes: number;
    mustLeaveJourneyId?: string;
    windowStart: number;
    windowEnd: number;
}>();

const rowStart = 85;
const rowGap = 72;

const chartBottom = computed(
    () => rowStart + (props.journeys.length - 1) * rowGap + 35
);
const chartHeight = computed(() => chartBottom.value + 30);
const tickInterval = computed(() => {
    const targetInterval = (props.windowEnd - props.windowStart) / 8;

    return (
        [5, 10, 15, 30, 60].find((interval) => interval >= targetInterval) ?? 60
    );
});
const ticks = computed(() => {
    const interval = tickInterval.value;
    const firstTick = Math.ceil(props.windowStart / interval) * interval;
    const numberOfTicks =
        Math.floor((props.windowEnd - firstTick) / interval) + 1;

    return Array.from(
        {length: numberOfTicks},
        (_, index) => firstTick + index * interval
    );
});

const segmentClasses: Record<SegmentKind, string> = {
    wait: "[stroke-width:3] [stroke-dasharray:4_5]",
    walk: "[stroke-width:5] [stroke-dasharray:1_7]",
    train: "[stroke-width:9]",
};

function xAt(minutes: number): string {
    const progress =
        (minutes - props.windowStart) / (props.windowEnd - props.windowStart);

    return `${progress * 85}%`;
}

function timelineLabelClasses(journey: Journey): string[] {
    return [
        "fill-ink text-xs font-medium [paint-order:stroke] [stroke-linejoin:round] [stroke-width:6]",
        journey.recommended ? "stroke-highlight" : "stroke-canvas",
    ];
}

function orderedSegments(journey: Journey): Journey["segments"] {
    return [
        ...journey.segments.filter((segment) => segment.kind === "walk"),
        ...journey.segments.filter((segment) => segment.kind === "wait"),
        ...journey.segments.filter((segment) => segment.kind === "train"),
    ];
}
</script>
