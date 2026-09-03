<template>
    <label class="sentenceField">
        {{ label }}
        <select
            ref="select"
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
import {computed, ref} from "vue";
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
const select = ref<HTMLSelectElement | null>(null);

interface JourneyLocationOption {
    key: string;
    label: string;
    value: LocationReference;
}

const selectedLocationKey = computed({
    get: () => {
        if (
            props.modelValue.type === "station" &&
            props.modelValue.groupId === undefined
        ) {
            return locationKey(props.modelValue);
        }

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
    const standaloneStationOption =
        props.modelValue.type === "station" &&
        props.modelValue.groupId === undefined
            ? [
                  {
                      key: selectedKey,
                      label: stationDisplayName(props.modelValue.crs),
                      value: props.modelValue,
                  },
              ]
            : [];

    return [
        ...standaloneStationOption,
        ...props.stationGroups.flatMap((group) =>
            getLocationOptionsForGroup(group, selectedKey)
        ),
    ];
});

function getLocationOptionsForGroup(
    group: StationGroup,
    selectedKey: string
): JourneyLocationOption[] {
    const groupLocation: LocationReference = {
        type: "group",
        groupId: group.id,
    };
    const groupOption = {
        key: locationKey(groupLocation),
        label: group.name,
        value: groupLocation,
    } satisfies JourneyLocationOption;
    const stationOptions = (group.stations.length > 1 ? group.stations : [])
        .filter((station) => stationIsAvailable(group, station, selectedKey))
        .map((station) => getStationLocationOption(group, station));
    const options = [
        ...(group.stations.length !== 1 ||
        group.stations[0]?.crs !== props.excludedCrs ||
        groupOption.key === selectedKey
            ? [groupOption]
            : []),
        ...stationOptions,
    ];

    return options.filter((option) =>
        locationOptionIsAvailable(group, option, selectedKey)
    );
}

function stationIsAvailable(
    group: StationGroup,
    station: StationGroup["stations"][number],
    selectedKey: string
): boolean {
    return (
        station.crs !== props.excludedCrs ||
        locationKey({
            type: "station",
            groupId: group.id,
            crs: station.crs,
        }) === selectedKey
    );
}

function getStationLocationOption(
    group: StationGroup,
    station: StationGroup["stations"][number]
): JourneyLocationOption {
    const value: LocationReference = {
        type: "station",
        groupId: group.id,
        crs: station.crs,
    };

    return {
        key: locationKey(value),
        label: `${group.name} - from ${stationDisplayName(station.crs)}`,
        value,
    };
}

function locationOptionIsAvailable(
    group: StationGroup,
    option: JourneyLocationOption,
    selectedKey: string
): boolean {
    if (option.key === selectedKey) {
        return true;
    }

    return (
        group.id !== props.excludedGroupId &&
        !props.excludedLocationKeys?.includes(option.key) &&
        (option.value.type !== "station" ||
            option.value.crs !== props.excludedCrs)
    );
}

function locationKey(location: LocationReference): string {
    if (location.type === "station" && location.groupId === undefined) {
        return `station:${location.crs}`;
    }

    return location.type === "group"
        ? `group:${location.groupId}`
        : `station:${location.groupId}:${location.crs}`;
}

function focus(): void {
    select.value?.focus();
}

defineExpose({focus});
</script>
