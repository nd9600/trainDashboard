<template>
    <div
        class="rounded-lg border border-line bg-surface p-3 text-sm sm:text-base text-ink-muted"
    >
        <p>
            No journeys were found for these routes, check them out on National Rail Enquiries:
        </p>
        <ul class="mt-2 space-y-1">
            <li
                v-for="route in journeyRoutes"
                :key="route.id"
                class="flex flex-wrap items-baseline gap-x-1"
            >
                <JourneyLabel :details="getStationRouteLabelDetails(route)" />
                <span>·</span>
                <NationalRailLink
                    class="text-sm!"
                    :originCrs="route.origin.crs"
                    :destinationCrs="route.destination.crs"
                    :departureMinutes="departureMinutes"
                    label="NRE"
                    :ariaLabel="`${getJourneyLabelText(getStationRouteLabelDetails(route))} on National Rail Enquiries`"
                />
            </li>
        </ul>
    </div>
</template>

<script setup lang="ts">
import type {JourneyRoute} from "../../journeys/planning/journeyRoutes";
import {
    getJourneyLabelText,
    getStationRouteLabelDetails,
} from "../../journeys/journeyLabels";
import JourneyLabel from "./JourneyLabel.vue";
import NationalRailLink from "./NationalRailLink.vue";

defineProps<{
    journeyRoutes: JourneyRoute[];
    departureMinutes: number;
}>();
</script>
