<template>
    <label class="sentenceField">
        {{ label }}
        <select
            v-model="selectedLocationKey"
            class="appInput sentenceField__control min-w-52 grow"
            required
        >
            <option value="">Choose a station or group</option>
            <option v-if="locationOptions.length === 0" disabled value="">
                No stations or groups are available
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
    excludedLocationKeys?: string[];
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

const selectedLocationKey = computed({
    get: () => {
        if (props.modelValue.groupId === "") {
            return "";
        }

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
    },
    set: (key: string) => {
        const selectedOption = locationOptions.value.find(
            (option) => option.key === key
        );

        if (selectedOption) {
            emit("update:modelValue", selectedOption.value);
        }
    },
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
                    label: `${group.name} - from ${stationDisplayName(station.crs)}`,
                    value: {
                        type: "station" as const,
                        groupId: group.id,
                        crs: station.crs,
                    },
                })),
        ].filter((option) => {
            if (option.key === selectedKey) {
                return true;
            }

            return (
                !isExcludedGroup &&
                !props.excludedLocationKeys?.includes(option.key) &&
                (option.value.type !== "station" ||
                    option.value.crs !== props.excludedCrs)
            );
        });
    });
});

function locationKey(location: LocationReference): string {
    return location.type === "group"
        ? `group:${location.groupId}`
        : `station:${location.groupId}:${location.crs}`;
}
</script>
