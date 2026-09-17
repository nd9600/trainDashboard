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
            <option v-for="option in locationOptions" :key="option.key" :value="option.key">
                {{ option.label }}
            </option>
        </select>
    </label>
</template>

<script setup lang="ts">
import {computed, ref} from "vue";
import type {LocationReference} from "../../../dto/journey.dto";
import type {StationGroup} from "../../../dto/stationGroup.dto";
import {stationDisplayName} from "../../../stations/stations";
import {getLocationKey} from "../../../journeys/journeyIdentity";

const props = defineProps<{
    stationGroups: StationGroup[];
    excludedGroupId?: string;
    excludedCrs?: string;
    excludedLocationKeys?: string[];
    label: string;
}>();
const location = defineModel<LocationReference>({required: true});
const select = ref<HTMLSelectElement>();
const selectedLocationKey = computed({
    get: () => getLocationKey(location.value, props.stationGroups),
    set: (key: string) => {
        const option = locationOptions.value.find((option) => option.key === key);
        if (option) location.value = option.value;
    },
});
const locationOptions = computed(() => {
    const options = props.stationGroups
        .flatMap((group) => {
            const values: LocationReference[] = [{type: "group", groupId: group.id}];
            if (group.stations.length > 1) {
                values.push(
                    ...group.stations.map(({crs}) => ({
                        type: "station" as const,
                        groupId: group.id,
                        crs,
                    }))
                );
            }
            return values.map((value) => ({
                value,
                key: getLocationKey(value),
                label:
                    value.type === "group"
                        ? group.name
                        : `${group.name} - from ${stationDisplayName(value.crs)}`,
                crs:
                    value.type === "station"
                        ? value.crs
                        : group.stations.length === 1
                          ? group.stations[0]!.crs
                          : undefined,
            }));
        })
        .filter(
            (option) =>
                option.key === selectedLocationKey.value ||
                (option.value.groupId !== props.excludedGroupId &&
                    !props.excludedLocationKeys?.includes(option.key) &&
                    (option.crs === undefined || option.crs !== props.excludedCrs))
        );
    const value = location.value;
    if (value.type === "station" && value.groupId === undefined) {
        options.unshift({
            value,
            key: getLocationKey(value),
            label: stationDisplayName(value.crs),
            crs: value.crs,
        });
    }
    return options;
});
defineExpose({focus: () => select.value?.focus()});
</script>
