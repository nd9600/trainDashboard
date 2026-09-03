<template>
    <section
        id="journey-settings-panel-stationGroups"
        class="space-y-4"
        aria-labelledby="journey-settings-tab-stationGroups"
        role="tabpanel"
    >
        <div>
            <h2 class="font-semibold">Station groups</h2>
            <p class="mt-1 text-sm text-ink-subtle">
                A group expands to each station when the dashboard builds
                journeys.
            </p>
        </div>

        <p v-if="stationGroups.length === 0" class="text-sm text-ink-subtle">
            Add your first place, such as Home or Work, then add its stations.
        </p>

        <StationGroupSettingsCard
            v-for="(group, groupIndex) in stationGroups"
            :key="group.id"
            v-model:group="stationGroups[groupIndex]!"
            @changed="emit('changed')"
            @remove="emit('remove', groupIndex)"
        />

        <button
            class="appButton appButton--secondary hover:bg-surface-muted"
            type="button"
            @click="addGroup"
        >
            <AppIcon class="size-4" name="plus" />
            Add station group
        </button>
    </section>
</template>

<script setup lang="ts">
import {nextTick} from "vue";
import AppIcon from "@/components/AppIcon.vue";
import type {StationGroup} from "../../../dto/stationGroup.dto";
import StationGroupSettingsCard from "./StationGroupSettingsCard.vue";

const stationGroups = defineModel<StationGroup[]>("stationGroups", {
    required: true,
});

const emit = defineEmits<{
    changed: [];
    remove: [groupIndex: number];
}>();

async function addGroup(): Promise<void> {
    const groupId = newId("group");
    stationGroups.value = [
        ...stationGroups.value,
        {
            id: groupId,
            name: "New group",
            stations: [{crs: ""}],
        },
    ];
    emit("changed");
    await nextTick();
    document.getElementById(`group-${groupId}-name`)?.focus();
}

function newId(prefix: string): string {
    const suffix = Math.random().toString(36).slice(2, 10);
    return `${prefix}-${suffix}`;
}
</script>
