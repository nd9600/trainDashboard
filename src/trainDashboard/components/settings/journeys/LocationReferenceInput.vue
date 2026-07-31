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

const selectedLocationKey = computed(() => {
    const selectedGroup = props.stationGroups.find(
        (group) => group.id === props.modelValue.groupId
    );

    if (selectedGroup?.stations.length === 1) {
        return locationKey({
            type: "group",
            groupId: selectedGroup.id,
        });
    }

    return locationKey(props.modelValue);
});

const locationOptions = computed<JourneyLocationOption[]>(() => {
    const selectedKey = selectedLocationKey.value;

    return props.stationGroups.flatMap((group) => {
        const isExcludedGroup = group.id === props.excludedGroupId;
        const groupLocation: LocationReference = {
            type: "group",
            groupId: group.id,
        };
        const groupOption = {
            key: locationKey(groupLocation),
            label: group.name,
            value: groupLocation,
        } satisfies JourneyLocationOption;

        return [
            ...(group.stations.length !== 1 ||
            group.stations[0]?.crs !== props.excludedCrs ||
            groupOption.key === selectedKey
                ? [groupOption]
                : []),
            ...(group.stations.length > 1 ? group.stations : [])
                .filter(
                    (station) =>
                        station.crs !== props.excludedCrs ||
                        locationKey({
                            type: "station",
                            groupId: group.id,
                            crs: station.crs,
                        }) === selectedKey
                )
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
        ].filter(
            (option) =>
                option.key === selectedKey ||
                (!isExcludedGroup &&
                    (option.value.type !== "station" ||
                        option.value.crs !== props.excludedCrs))
        );
    });
});

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
