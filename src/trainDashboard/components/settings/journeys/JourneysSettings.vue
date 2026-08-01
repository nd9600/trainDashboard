<template>
    <section
        id="journey-settings-panel-journeys"
        class="space-y-4"
        aria-labelledby="journey-settings-tab-journeys"
        role="tabpanel"
    >
        <div>
            <h2 class="font-semibold">Journeys</h2>
            <p class="mt-1 text-sm text-ink-subtle">
                Each journey has one direction. Add the reverse direction as a
                separate journey.
            </p>
        </div>

        <p
            v-if="stationGroups.length < 2"
            class="rounded border border-danger bg-danger-surface p-3 text-sm text-danger-dark"
            role="status"
        >
            Add at least two station groups before you add a journey. A journey
            needs different start and finish locations.
        </p>

        <JourneySettingsCard
            v-for="(journey, journeyIndex) in journeys"
            :key="journey.id"
            v-model:journey="journeys[journeyIndex]!"
            :stationGroups="stationGroups"
            @changed="emit('changed')"
            @remove="emit('remove', journeyIndex)"
        />

        <button
            class="appButton appButton--primary"
            type="button"
            :disabled="stationGroups.length < 2"
            @click="addJourney"
        >
            <AppIcon class="size-4" name="plus" />
            Add journey
        </button>
    </section>
</template>

<script setup lang="ts">
import AppIcon from "@/components/AppIcon.vue";
import type {
    LocationReference,
    StationGroup,
    Journey,
} from "../../../dto/dashboardConfig.dto";
import JourneySettingsCard from "./JourneySettingsCard.vue";

const props = defineProps<{
    stationGroups: StationGroup[];
}>();

const journeys = defineModel<Journey[]>("journeys", {required: true});

const emit = defineEmits<{
    changed: [];
    remove: [journeyIndex: number];
}>();

function addJourney(): void {
    journeys.value = [
        ...journeys.value,
        {
            id: newId("journey"),
            origin: defaultLocation(),
            destination: defaultLocation(),
        },
    ];
    emit("changed");
}

function defaultLocation(): LocationReference {
    return {
        type: "group",
        groupId: props.stationGroups.at(0)?.id ?? "",
    };
}

function newId(prefix: string): string {
    const suffix = Math.random().toString(36).slice(2, 10);
    return `${prefix}-${suffix}`;
}
</script>
