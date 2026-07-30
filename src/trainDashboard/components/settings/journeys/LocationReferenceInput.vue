<template>
    <label class="sentenceField">
        {{ label }}
        <select
            class="appInput sentenceField__control min-w-52 grow"
            :value="selectedKey"
            required
            @change="updateLocation"
        >
            <option v-if="locationOptions.length === 0" disabled value="">
                Add a station group first
            </option>
            <option
                v-for="option in locationOptions"
                :key="option.key"
                :value="option.key"
            >
                {{ option.label }}
            </option>
        </select>
    </label>
</template>

<script setup lang="ts">
import {computed} from "vue";
import type {
    LocationReference,
    StationGroup,
} from "../../../dto/dashboardConfig.dto";
import {stationDisplayName} from "../../../stations/stations";

const props = defineProps<{
    modelValue: LocationReference;
    groups: StationGroup[];
    label: string;
}>();

const emit = defineEmits<{
    "update:modelValue": [value: LocationReference];
}>();

interface LocationOption {
    key: string;
    label: string;
    value: LocationReference;
}

const locationOptions = computed<LocationOption[]>(() =>
    props.groups.flatMap((group) => [
        {
            key: locationKey({type: "group", groupId: group.id}),
            label: `${group.name}`,
            value: {type: "group", groupId: group.id},
        },
        ...group.stations.map((station) => ({
            key: locationKey({
                type: "station",
                groupId: group.id,
                crs: station.crs,
            }),
            label: `${group.name} - through ${stationDisplayName(station.crs)}`,
            value: {
                type: "station" as const,
                groupId: group.id,
                crs: station.crs,
            },
        })),
    ])
);

const selectedKey = computed(() => locationKey(props.modelValue));

function updateLocation(event: Event): void {
    const selectedOption = locationOptions.value.find(
        (option) => option.key === inputValue(event)
    );

    if (!selectedOption) {
        return;
    }

    emit("update:modelValue", selectedOption.value);
}

function inputValue(event: Event): string {
    return (event.target as HTMLSelectElement).value;
}

function locationKey(location: LocationReference): string {
    return location.type === "group"
        ? `group:${location.groupId}`
        : `station:${location.groupId}:${location.crs}`;
}
</script>
