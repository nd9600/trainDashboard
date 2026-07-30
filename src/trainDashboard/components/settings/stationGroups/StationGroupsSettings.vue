<template>
    <section
        id="journey-settings-panel-groups"
        class="space-y-4"
        aria-labelledby="journey-settings-tab-groups"
        role="tabpanel"
    >
        <div>
            <h2 class="font-semibold">Station groups</h2>
            <p class="mt-1 text-sm text-ink-subtle">
                A group expands to each station when the dashboard builds
                journeys.
            </p>
        </div>

        <StationGroupSettingsCard
            v-for="(group, groupIndex) in groups"
            :key="group.id"
            v-model:group="groups[groupIndex]!"
            @changed="emit('changed')"
            @remove="emit('remove', groupIndex)"
        />

        <button
            class="flex items-center gap-1.5 rounded border border-line-strong bg-paper px-3 py-2 text-sm font-semibold hover:bg-surface-muted"
            type="button"
            @click="addGroup"
        >
            <AppIcon class="size-4" name="plus" />
            Add station group
        </button>
    </section>
</template>

<script setup lang="ts">
import AppIcon from "@/components/AppIcon.vue";
import type {StationGroup} from "../../../dto/dashboardConfig.dto";
import StationGroupSettingsCard from "./StationGroupSettingsCard.vue";

const groups = defineModel<StationGroup[]>("groups", {required: true});

const emit = defineEmits<{
    changed: [];
    remove: [groupIndex: number];
}>();

function addGroup(): void {
    groups.value = [
        ...groups.value,
        {
            id: newId("group"),
            name: "New group",
            stations: [{crs: ""}],
        },
    ];
    emit("changed");
}

function newId(prefix: string): string {
    const suffix = Math.random().toString(36).slice(2, 10);
    return `${prefix}-${suffix}`;
}
</script>
