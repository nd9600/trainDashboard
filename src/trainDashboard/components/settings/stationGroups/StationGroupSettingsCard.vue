<template>
    <div class="rounded-lg border border-line bg-paper p-4 shadow-sm">
        <div class="flex items-end gap-3">
            <label class="grow">
                <span class="mb-1 block text-xs text-ink-subtle">
                    Group name
                </span>
                <input
                    v-model="group.name"
                    class="w-full rounded border border-line-strong bg-paper px-2 py-1.5"
                    required
                />
            </label>
            <button
                class="flex items-center gap-1.5 px-2 py-1 text-sm text-danger hover:underline"
                type="button"
                @click="emit('remove')"
            >
                <AppIcon class="size-4" name="trash" />
                Remove group
            </button>
        </div>

        <div class="mt-3 space-y-2">
            <div
                v-for="(station, stationIndex) in group.stations"
                :key="stationIndex"
                class="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2"
            >
                <div>
                    <span class="mb-1 block text-xs text-ink-subtle">
                        Station
                    </span>
                    <StationInput
                        v-model="station.crs"
                        :id="`group-${group.id}-station-${stationIndex}`"
                    />
                </div>
                <button
                    class="flex size-9 items-center justify-center text-danger hover:bg-danger-surface"
                    type="button"
                    aria-label="Remove station"
                    @click="removeStation(stationIndex)"
                >
                    <AppIcon class="size-4" name="trash" />
                </button>
            </div>
        </div>

        <button
            class="mt-3 flex items-center gap-1.5 rounded border border-line-strong bg-paper px-3 py-1.5 text-sm font-semibold hover:bg-surface-muted"
            type="button"
            @click="addStation"
        >
            <AppIcon class="size-4" name="plus" />
            Add station
        </button>
    </div>
</template>

<script setup lang="ts">
import AppIcon from "@/components/AppIcon.vue";
import type {StationGroup} from "../../../dto/dashboardConfig.dto";
import StationInput from "./StationInput.vue";

const group = defineModel<StationGroup>("group", {required: true});

const emit = defineEmits<{
    changed: [];
    remove: [];
}>();

function addStation(): void {
    group.value.stations.push({crs: ""});
    emit("changed");
}

function removeStation(stationIndex: number): void {
    group.value.stations.splice(stationIndex, 1);
    emit("changed");
}
</script>
