<template>
    <ol class="mt-2">
        <li
            v-for="step in itinerarySteps"
            :key="step.id"
            class="grid grid-cols-[3.25rem_minmax(0,1fr)] gap-2 items-start"
        >
            <NationalRailLink
                v-if="step.trainLeg && step.time"
                class="py-3 text-right block! text-xs! font-semibold! text-ink!"
                :originCrs="step.trainLeg.origin"
                :destinationCrs="step.trainLeg.destination"
                :departureMinutes="step.trainLeg.departure"
                :label="formatTime(step.time)"
            />
            <time
                v-else
                class="py-3 text-right text-xs font-semibold text-ink"
            >
                {{ step.time === undefined ? "" : formatTime(step.time) }}
            </time>
            <div class="border-l pl-2 py-3 flex gap-2 items-start border-line">
                <div
                    class="flex size-4 items-center justify-center rounded-full bg-paper text-primary"
                >
                    <AppIcon class="size-3" :name="stepIcon(step.kind)" />
                </div>
                <div>
                    <p
                        class="leading-tight text-ink-muted"
                        :class="
                            ['change', 'walk'].includes(step.kind)
                                ? 'text-xs'
                                : ''
                        "
                    >
                        {{ step.label }}
                        <strong
                            v-if="step.stationCrs"
                            :style="{color: stationColour(step.stationCrs)}"
                        >
                            {{ stationName(step.stationCrs) }}
                        </strong>
                        {{ step.suffix }}
                    </p>

                    <AlternativeFirstTrainLink
                        v-if="step.alternativeFirstTrainLeg"
                        class="mt-1 flex"
                        :trainLeg="step.alternativeFirstTrainLeg"
                    />
                </div>
            </div>
        </li>
    </ol>
</template>

<script setup lang="ts">
import {computed} from "vue";
import AppIcon from "@/components/AppIcon.vue";
import {formatTime} from "@/utilities/time.utility.ts";
import type {
    TimetabledJourney,
    TrainLeg,
} from "../../dto/timetabledJourney.dto";
import {stationColour} from "../../stations/stationColours";
import {stationName} from "../../stations/stations";
import AlternativeFirstTrainLink from "./AlternativeFirstTrainLink.vue";
import NationalRailLink from "./NationalRailLink.vue";

const props = defineProps<{
    journey: TimetabledJourney;
}>();

type ItineraryStepKind = "arrival" | "change" | "train" | "walk";

interface ItineraryStep {
    id: string;
    kind: ItineraryStepKind;
    label: string;
    stationCrs?: string;
    suffix?: string;
    time?: number;
    trainLeg?: TrainLeg;
    alternativeFirstTrainLeg?: TrainLeg;
}

const itinerarySteps = computed<ItineraryStep[]>(() => {
    const journey = props.journey;
    const firstSegment = journey.segments.at(0)!;
    const lastSegment = journey.segments.at(-1)!;
    const steps: ItineraryStep[] = [];

    if (firstSegment.kind === "walk") {
        steps.push({
            id: "walk-to-origin",
            kind: "walk",
            time: firstSegment.start,
            label: "Leave for",
            stationCrs: journey.origin,
            suffix: ` · ${formatDuration(firstSegment.start, firstSegment.end)} walk`,
        });
    }

    journey.trainLegs.forEach((leg, index) => {
        steps.push({
            id: `train-${index}`,
            kind: "train",
            time: leg.departure,
            label: "Train from",
            stationCrs: leg.origin,
            trainLeg: leg,
            alternativeFirstTrainLeg:
                index === 0
                    ? journey.alternativeFirstTrainLegs?.at(0)
                    : undefined,
        });
        steps.push({
            id: `arrival-${index}`,
            kind: "arrival",
            time: leg.arrival,
            label: "Arrive",
            stationCrs: leg.destination,
        });

        const nextLeg = journey.trainLegs[index + 1];

        if (nextLeg) {
            steps.push({
                id: `change-${index}`,
                kind: "change",
                label: `Change trains · ${formatDuration(leg.arrival, nextLeg.departure)}`,
            });
        }
    });

    if (lastSegment.kind === "walk") {
        const destinationName = journey.arrivalLabel ?? "your destination";

        steps.push({
            id: "walk-to-destination",
            kind: "walk",
            label: `Walk to ${destinationName} · ${formatDuration(lastSegment.start, lastSegment.end)} walk`,
        });
        steps.push({
            id: "final-arrival",
            kind: "arrival",
            time: lastSegment.end,
            label: `Arrive at ${destinationName}`,
        });
    }

    return steps;
});

function formatDuration(start: number, end: number): string {
    const minutes = end - start;
    return `${minutes} minute${minutes === 1 ? "" : "s"}`;
}

function stepIcon(
    kind: ItineraryStepKind
): "clock" | "map-pin" | "train" | "walk" {
    switch (kind) {
        case "arrival":
            return "map-pin";
        case "change":
            return "clock";
        case "train":
            return "train";
        case "walk":
            return "walk";
    }
}
</script>
