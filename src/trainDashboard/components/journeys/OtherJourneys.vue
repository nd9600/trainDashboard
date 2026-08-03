<template>
    <details
        v-if="journeyGroups.length"
        class="group mt-8 overflow-auto rounded-lg border border-line bg-surface max-sm:rounded-none max-sm:border-x-0"
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
        <div class="space-y-6 border-t border-line bg-canvas sm:p-4">
            <nav
                v-if="journeyGroups.length > 1"
                class="border-b border-line px-4 pt-4 pb-4 sm:px-0 sm:pt-0"
                aria-label="Other journey sections"
            >
                <p class="mb-2 text-xs font-semibold text-ink-subtle">
                    Jump to a journey:
                </p>
                <ol>
                    <li
                        v-for="(journeyGroup, index) in journeyGroups"
                        :key="`link-${journeyGroup.anchorId}`"
                    >
                        <a
                            class="appButton appButton--quiet max-w-full px-2 py-1 text-left text-xs"
                            :href="`#${journeyGroup.anchorId}`"
                        >
                            {{ index + 1 }}. {{ journeyGroup.label }}
                        </a>
                    </li>
                </ol>
            </nav>
            <section
                v-for="journeyGroup in journeyGroups"
                :id="journeyGroup.anchorId"
                :key="journeyGroup.anchorId"
                class="scroll-mt-6 max-sm:py-4 not-last:border-b-1 border-casa pb-8"
            >
                <div class="flex justify-between max-w-full">
                    <h2 class="mb-2 font-display text-base max-sm:px-4 sm:text-lg">
                        {{ journeyGroup.label }}
                    </h2>
                    <a
                        class="appButton appButton--quiet px-2 py-1 text-left text-xl"
                        href="#"
                    >
                        ⇑
                    </a>
                </div>

                <JourneyTimelines
                    v-if="journeyGroup.timetabledJourneys.length"
                    :journeys="journeyGroup.timetabledJourneys"
                    :currentMinutes="currentMinutes"
                    :mustLeaveJourneyId="firstSecondaryJourneyId"
                    :flushOnMobile="true"
                />
                <NationalRailRouteLinks
                    v-if="journeyGroup.missingRoutes.length"
                    :class="[
                        'max-sm:mx-4',
                        journeyGroup.timetabledJourneys.length
                            ? 'mt-4'
                            : undefined,
                    ]"
                    :journeyRoutes="journeyGroup.missingRoutes"
                    :departureMinutes="currentMinutes"
                />
            </section>
        </div>
    </details>
</template>

<script setup lang="ts">
import {computed} from "vue";
import AppIcon from "@/components/AppIcon.vue";
import type {TimetabledJourney} from "../../dto/timetabledJourney.dto";
import type {JourneyRoute} from "../../journeys/planning/journeyRoutes";
import {getRoutesWithoutTimetabledJourneys} from "../../journeys/missingTimetables/getRoutesWithoutTimetabledJourneys";
import JourneyTimelines from "./JourneyTimelines.vue";
import NationalRailRouteLinks from "./NationalRailRouteLinks.vue";

const props = defineProps<{
    journeyRoutes: JourneyRoute[];
    timetabledJourneys: TimetabledJourney[];
    currentMinutes: number;
}>();

const firstSecondaryJourneyId = computed(
    () => props.timetabledJourneys.at(0)?.id
);
const journeyGroups = computed(() => {
    const stationGroups = new Map<
        string,
        {
            routes: JourneyRoute[];
            timetabledJourneys: TimetabledJourney[];
        }
    >();

    for (const route of props.journeyRoutes) {
        const group = stationGroups.get(route.contextLabel);

        if (group) {
            group.routes.push(route);
        } else {
            stationGroups.set(route.contextLabel, {
                routes: [route],
                timetabledJourneys: [],
            });
        }
    }

    for (const journey of props.timetabledJourneys) {
        const group = stationGroups.get(journey.contextLabel);

        if (group) {
            group.timetabledJourneys.push(journey);
        }
    }

    return Array.from(stationGroups, ([label, group]) => ({
        label,
        anchorId: `other-journey-${group.routes.at(0)!.journeyId}`,
        ...group,
        missingRoutes: getRoutesWithoutTimetabledJourneys(
            group.routes,
            group.timetabledJourneys
        ),
    }));
});
</script>
