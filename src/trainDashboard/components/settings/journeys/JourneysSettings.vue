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

        <JourneySettingsCard
            v-for="(pair, pairIndex) in pairs"
            :key="pair.id"
            v-model:pair="pairs[pairIndex]!"
            :groups="groups"
            @changed="emit('changed')"
            @remove="emit('remove', pairIndex)"
        />

        <button
            class="appButton appButton--primary"
            type="button"
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
    StationPair,
} from "../../../dto/dashboardConfig.dto";
import JourneySettingsCard from "./JourneySettingsCard.vue";

const props = defineProps<{
    groups: StationGroup[];
}>();

const pairs = defineModel<StationPair[]>("pairs", {required: true});

const emit = defineEmits<{
    changed: [];
    remove: [pairIndex: number];
}>();

function addJourney(): void {
    pairs.value = [
        ...pairs.value,
        {
            id: newId("pair"),
            origin: defaultLocation(),
            destination: defaultLocation(),
        },
    ];
    emit("changed");
}

function defaultLocation(): LocationReference {
    return {
        type: "group",
        groupId: props.groups.at(0)?.id ?? "",
    };
}

function newId(prefix: string): string {
    const suffix = Math.random().toString(36).slice(2, 10);
    return `${prefix}-${suffix}`;
}
</script>
