<template>
    <label class="sentenceField">
        {{ label }}
        <select
            class="appInput sentenceField__control min-w-52 grow"
            :value="selectedLocationKey"
            required
            @change="selectLocation"
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
    stationGroups: StationGroup[];
    excludedGroupId?: string;
    excludedCrs?: string;
    label: string;
}>();

const emit = defineEmits<{
    "update:modelValue": [value: LocationReference];
}>();

interface JourneyLocationOption {
    key: string;
    label: string;
    value: LocationReference;
}

const locationOptions = computed<JourneyLocationOption[]>(() =>
    props.stationGroups
        .filter((group) => group.id !== props.excludedGroupId)
        .flatMap((group) => [
            ...(group.stations.length !== 1 ||
            group.stations[0]?.crs !== props.excludedCrs
                ? [
                      {
                          key: locationKey({type: "group", groupId: group.id}),
                          label: `${group.name}`,
                          value: {type: "group" as const, groupId: group.id},
                      },
                  ]
                : []),
            ...(group.stations.length > 1 ? group.stations : [])
                .filter((station) => station.crs !== props.excludedCrs)
                .map((station) => ({
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

const selectedLocationKey = computed(() => locationKey(props.modelValue));

function selectLocation(event: Event): void {
    const selectedOption = locationOptions.value.find(
        (option) => option.key === getSelectValue(event)
    );

    if (!selectedOption) {
        return;
    }

    emit("update:modelValue", selectedOption.value);
}

function getSelectValue(event: Event): string {
    return (event.target as HTMLSelectElement).value;
}

function locationKey(location: LocationReference): string {
    return location.type === "group"
        ? `group:${location.groupId}`
        : `station:${location.groupId}:${location.crs}`;
}
</script>
