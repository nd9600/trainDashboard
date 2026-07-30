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
                top: `${rowStart + index * rowGap - 26}px`,
                height: '52px',
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
                <span class="leading-tight">
                    <span class="block">{{ journey.label }}</span>
                    <span
                        v-if="journey.recommended"
                        class="mt-1 flex items-center gap-1 text-xs font-bold text-danger"
                    >
                        <AppIcon class="size-3.5" name="clock" />
                        {{ mustLeaveText(journey, now) }}
                    </span>
                </span>
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
                :width="xAt(now)"
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

                <text
                    :class="[
                        'fill-ink text-xs font-medium [paint-order:stroke] [stroke-linejoin:round] [stroke-width:6]',
                        journey.recommended
                            ? 'stroke-highlight'
                            : 'stroke-canvas',
                    ]"
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

            <line
                class="stroke-danger [stroke-width:2]"
                :x1="xAt(now)"
                y1="45"
                :x2="xAt(now)"
                :y2="chartBottom"
            />
            <text
                class="fill-danger text-xs"
                :x="xAt(now)"
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
import type {Journey, SegmentKind} from "../../dto/journey.dto";
import {mustLeaveText} from "../../presentation/journeyPresentation";
import {stationColour} from "../../stations/stationColours";

const props = defineProps<{
    journeys: Journey[];
    now: number;
    windowStart: number;
    windowEnd: number;
}>();

const rowStart = 85;
const rowGap = 60;

const chartBottom = computed(
    () => rowStart + (props.journeys.length - 1) * rowGap + 35
);
const chartHeight = computed(() => chartBottom.value + 30);

const ticks = computed(() => {
    const firstTick = Math.ceil(props.windowStart / 10) * 10;
    const numberOfTicks = Math.floor((props.windowEnd - firstTick) / 10) + 1;

    return Array.from(
        {length: numberOfTicks},
        (_, index) => firstTick + index * 10
    );
});

const segmentClasses: Record<SegmentKind, string> = {
    walk: "[stroke-width:5] [stroke-dasharray:1_7]",
    train: "[stroke-width:9]",
};

function xAt(minutes: number): string {
    const progress =
        (minutes - props.windowStart) / (props.windowEnd - props.windowStart);

    return `${progress * 85}%`;
}

function formatTime(minutes: number): string {
    const normalisedMinutes = ((minutes % 1440) + 1440) % 1440;
    const hours = Math.floor(normalisedMinutes / 60);
    const remainingMinutes = normalisedMinutes % 60;

    return `${hours}:${remainingMinutes.toString().padStart(2, "0")}`;
}

function orderedSegments(journey: Journey): Journey["segments"] {
    return [
        ...journey.segments.filter((segment) => segment.kind === "walk"),
        ...journey.segments.filter((segment) => segment.kind === "train"),
    ];
}
</script>
