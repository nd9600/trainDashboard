<template>
    <div class="rounded-lg border border-line bg-paper p-4 shadow-sm">
        <div class="flex items-end gap-3">
            <label class="grow">
                <span class="mb-1 block text-xs text-ink-subtle">
                    Group name
                </span>
                <input v-model="group.name" class="appInput" required />
            </label>
            <button
                class="appButton appButton--danger px-2 py-1"
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
                class="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-x-2 gap-y-2"
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
                    class="appButton appButton--danger appButton--icon"
                    type="button"
                    aria-label="Remove station"
                    @click="removeStation(stationIndex)"
                >
                    <AppIcon class="size-4" name="trash" />
                </button>
                <label
                    class="col-span-2 flex flex-wrap items-baseline gap-2 pr-11 pl-3 text-sm text-ink-muted"
                >
                    Walking here takes
                    <input
                        class="appInput w-20 grow-0"
                        :min="0"
                        placeholder="Not set"
                        :step="1"
                        :value="station.walkMinutes ?? ''"
                        type="number"
                        @input="updateWalkMinutes(stationIndex, $event)"
                    />
                    minutes.
                </label>
            </div>
        </div>

        <button
            class="appButton appButton--secondary mt-3 py-1.5 hover:bg-surface-muted"
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

function updateWalkMinutes(stationIndex: number, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    const station = group.value.stations[stationIndex]!;
    station.walkMinutes = value === "" ? undefined : Number(value);
}
</script>
