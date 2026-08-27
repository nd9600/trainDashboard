<template>
    <div class="relative z-10 min-w-0">
        <svg
            class="overflow-visible"
            width="100%"
            :height="chartHeight"
            role="img"
            aria-label="Comparison of possible train journeys"
            :aria-describedby="chartDescriptionId"
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
                        stroke: getSegmentColour(journey, segment),
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
                    <line
                        class="stroke-ink-subtle [stroke-width:1]"
                        :x1="xAt(leg.arrival)"
                        y1="-4"
                        :x2="xAt(leg.arrival)"
                        y2="-25"
                    />
                    <line
                        class="stroke-ink-subtle [stroke-width:1]"
                        :x1="xAt(journey.trainLegs[legIndex + 1]!.departure)"
                        y1="-4"
                        :x2="xAt(journey.trainLegs[legIndex + 1]!.departure)"
                        y2="-7"
                    />
                    <text
                        :class="timelineLabelClasses(journey)"
                        :x="xAt(leg.arrival)"
                        y="-32"
                        text-anchor="middle"
                    >
                        {{ formatTime(leg.arrival) }}a
                    </text>
                    <text
                        :class="timelineLabelClasses(journey)"
                        :x="xAt(journey.trainLegs[legIndex + 1]!.departure)"
                        y="-14"
                        text-anchor="middle"
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

        <ol :id="chartDescriptionId" class="sr-only">
            <li v-for="journey in journeys" :key="`description-${journey.id}`">
                <JourneyRouteLabel :journey="journey" />. Leave
                {{ formatTime(journey.trainLegs[0]!.departure) }} from
                {{ stationName(journey.origin) }}. Arrive at
                {{ stationName(journey.destination) }}
                {{ journey.arrivalTime ?? journey.railArrivalTime }}.
                <span v-if="journey.trainLegs.length === 1">Direct train.</span>
                <span v-else>
                    {{ journey.trainLegs.length - 1 }} train change<span
                        v-if="journey.trainLegs.length > 2"
                        >s</span
                    >.
                </span>
            </li>
        </ol>
    </div>
</template>

<script setup lang="ts">
import {scaleLinear} from "d3-scale";
import {computed, useId} from "vue";
import {formatTime} from "@/utilities/time.utility.ts";
import type {
    SegmentKind,
    TimetabledJourney,
} from "../../dto/timetabledJourney.dto";
import {stationColour} from "../../stations/stationColours";
import {stationName} from "../../stations/stations";
import JourneyRouteLabel from "./JourneyRouteLabel.vue";

const props = defineProps<{
    journeys: TimetabledJourney[];
    currentMinutes: number;
    windowStart: number;
    windowEnd: number;
    rowStart: number;
    rowGap: number;
}>();

const chartDescriptionId = useId();
const chartBottom = computed(
    () =>
        props.rowStart +
        (props.journeys.length - 1) * props.rowGap +
        props.rowGap / 2
);
const chartHeight = computed(() => chartBottom.value + 30);
const timelineScale = computed(() =>
    scaleLinear().domain([props.windowStart, props.windowEnd]).range([0, 85])
);
const ticks = computed(() => timelineScale.value.ticks(8));

const segmentClasses: Record<SegmentKind, string> = {
    wait: "[stroke-width:3] [stroke-dasharray:4_5]",
    walk: "[stroke-width:5] [stroke-dasharray:1_7]",
    train: "[stroke-width:9]",
};

function xAt(minutes: number): string {
    return `${timelineScale.value(minutes)}%`;
}

function timelineLabelClasses(journey: TimetabledJourney): string[] {
    return [
        "fill-ink text-xs font-medium [paint-order:stroke] [stroke-linejoin:round] [stroke-width:6]",
        journey.recommended ? "stroke-highlight" : "stroke-canvas",
    ];
}

function getSegmentColour(
    journey: TimetabledJourney,
    segment: TimetabledJourney["segments"][number]
): string {
    const stationCrs =
        segment.kind === "train"
            ? journey.trainLegs.find(
                  (leg) =>
                      leg.departure === segment.start &&
                      leg.arrival === segment.end
              )?.origin
            : journey.trainLegs.find((leg) => leg.arrival === segment.start)
                  ?.destination;

    return stationColour(stationCrs ?? journey.origin);
}

function orderedSegments(
    journey: TimetabledJourney
): TimetabledJourney["segments"] {
    return [
        ...journey.segments.filter((segment) => segment.kind === "walk"),
        ...journey.segments.filter((segment) => segment.kind === "wait"),
        ...journey.segments.filter((segment) => segment.kind === "train"),
    ];
}
</script>
