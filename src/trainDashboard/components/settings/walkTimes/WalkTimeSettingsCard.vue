<template>
    <div class="rounded-lg border border-line bg-paper p-4 shadow-sm">
        <h3 class="font-semibold">{{ group.name }}</h3>
        <div class="mt-3 space-y-3">
            <label
                v-for="(station, stationIndex) in group.stations"
                :key="station.crs"
                class="sentenceField"
            >
                Walking between {{ group.name }} and
                {{ stationDisplayName(station.crs) }} takes
                <input
                    class="appInput sentenceField__control w-20 grow-0"
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
