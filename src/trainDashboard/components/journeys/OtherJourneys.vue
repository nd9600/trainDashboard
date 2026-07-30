<template>
    <details
        v-if="journeyGroups.length"
        class="group mt-8 overflow-auto rounded-lg border border-line bg-surface"
    >
        <summary
            class="flex cursor-pointer list-none items-center gap-2 px-4 py-3 font-semibold text-ink-muted"
        >
            <AppIcon
                class="size-4 transition-transform group-open:rotate-90"
                name="chevron"
            />
            <AppIcon class="size-4" name="train" />
            Other journeys
        </summary>
        <div class="space-y-6 border-t border-line bg-canvas p-4">
            <section
                v-for="journeyGroup in journeyGroups"
                :key="journeyGroup.label"
            >
                <h2 class="mb-2 font-display text-lg">
                    {{ journeyGroup.label }}
                </h2>
                <JourneyTimeline
                    v-if="journeyGroup.journeys.length"
                    :journeys="journeyGroup.journeys"
                    :now="now"
                    :mustLeaveJourneyId="firstSecondaryJourneyId"
                />
                <NationalRailRouteLinks
                    v-if="journeyGroup.missingPairs.length"
                    :class="journeyGroup.journeys.length ? 'mt-4' : undefined"
                    :pairs="journeyGroup.missingPairs"
                    :departureMinutes="now"
                />
            </section>
        </div>
    </details>
</template>

<script setup lang="ts">
import {computed} from "vue";
import AppIcon from "@/components/AppIcon.vue";
import type {Journey} from "../../dto/journey.dto";
import type {ResolvedStationPair} from "../../journeys/getCurrentJourneyPriorities";
import {getStationPairsWithoutJourneys} from "../../journeys/getStationPairsWithoutJourneys";
import JourneyTimeline from "./JourneyTimeline.vue";
import NationalRailRouteLinks from "./NationalRailRouteLinks.vue";

const props = defineProps<{
    pairs: ResolvedStationPair[];
    journeys: Journey[];
    now: number;
}>();

const firstSecondaryJourneyId = computed(() => props.journeys.at(0)?.id);
const journeyGroups = computed(() => {
    const groups = new Map<
        string,
        {
            pairs: ResolvedStationPair[];
            journeys: Journey[];
        }
    >();

    for (const pair of props.pairs) {
        const group = groups.get(pair.contextLabel);

        if (group) {
            group.pairs.push(pair);
        } else {
            groups.set(pair.contextLabel, {pairs: [pair], journeys: []});
        }
    }

    for (const journey of props.journeys) {
        const group = groups.get(journey.contextLabel);

        if (group) {
            group.journeys.push(journey);
        }
    }

    return Array.from(groups, ([label, group]) => ({
        label,
        ...group,
        missingPairs: getStationPairsWithoutJourneys(
            group.pairs,
            group.journeys
        ),
    }));
});
</script>
