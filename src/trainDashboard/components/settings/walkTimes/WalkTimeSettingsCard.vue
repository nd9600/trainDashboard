<template>
    <div class="rounded-lg border border-line bg-paper p-4 shadow-sm">
        <h3 class="font-semibold">{{ group.name }}</h3>
        <div class="mt-3 space-y-3">
            <div
                class="hidden grid-cols-[minmax(0,1fr)_8rem] text-xs text-ink-subtle sm:grid"
            >
                <span>Station</span>
                <span>Walk minutes</span>
            </div>
            <label
                v-for="(station, stationIndex) in group.stations"
                :key="station.crs"
                class="grid items-center gap-1 sm:grid-cols-[minmax(0,1fr)_8rem]"
            >
                <span>{{ stationDisplayName(station.crs) }}</span>
                <span>
                    <span class="mb-1 block text-xs text-ink-subtle sm:hidden">
                        Walk minutes
                    </span>
                    <input
                        class="appInput"
                        :min="0"
                        placeholder="Not set"
                        :step="1"
                        :value="station.walkMinutes ?? ''"
                        type="number"
                        @input="updateWalkMinutes(stationIndex, $event)"
                    />
                </span>
            </label>
        </div>
    </div>
</template>

<script setup lang="ts">
import type {StationGroup} from "../../../dto/dashboardConfig.dto";
import {stationDisplayName} from "../../../stations/stations";

const group = defineModel<StationGroup>("group", {required: true});

const emit = defineEmits<{
    changed: [];
}>();

function updateWalkMinutes(stationIndex: number, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    const station = group.value.stations[stationIndex]!;
    station.walkMinutes = value === "" ? undefined : Number(value);
    emit("changed");
}
</script>
