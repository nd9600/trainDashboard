<template>
    <div class="grid gap-2 sm:grid-cols-[8rem_minmax(0,1fr)_minmax(0,1fr)]">
        <label>
            <span class="mb-1 block text-xs text-ink-subtle">Type</span>
            <select
                class="appInput"
                :value="modelValue.type"
                @change="changeType"
            >
                <option value="station">Station</option>
                <option value="group">Station group</option>
            </select>
        </label>

        <label>
            <span class="mb-1 block text-xs text-ink-subtle">Place</span>
            <select
                class="appInput"
                :value="modelValue.groupId"
                required
                @change="updateGroup"
            >
                <option
                    v-for="group in groups"
                    :key="group.id"
                    :value="group.id"
                >
                    {{ group.name }}
                </option>
            </select>
        </label>

        <label v-if="modelValue.type === 'station'">
            <span class="mb-1 block text-xs text-ink-subtle">Station</span>
            <select
                class="appInput"
                :value="modelValue.crs"
                required
                @change="updateStation"
            >
                <option
                    v-for="station in selectedGroup?.stations ?? []"
                    :key="station.crs"
                    :value="station.crs"
                >
                    {{ stationDisplayName(station.crs) }}
                </option>
            </select>
        </label>
    </div>
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
}>();

const emit = defineEmits<{
    "update:modelValue": [value: LocationReference];
}>();

const selectedGroup = computed(() =>
    props.groups.find((group) => group.id === props.modelValue.groupId)
);

function changeType(event: Event): void {
    const type = inputValue(event);
    const group = selectedGroup.value ?? props.groups.at(0);
    const groupId = group?.id ?? "";

    if (type === "group") {
        emit("update:modelValue", {type: "group", groupId});
        return;
    }

    emit("update:modelValue", {
        type: "station",
        groupId,
        crs: group?.stations.at(0)?.crs ?? "",
    });
}

function updateGroup(event: Event): void {
    const groupId = inputValue(event);

    if (props.modelValue.type === "group") {
        emit("update:modelValue", {type: "group", groupId});
        return;
    }

    const group = props.groups.find((candidate) => candidate.id === groupId);
    emit("update:modelValue", {
        type: "station",
        groupId,
        crs: group?.stations.at(0)?.crs ?? "",
    });
}

function updateStation(event: Event): void {
    if (props.modelValue.type !== "station") {
        return;
    }

    emit("update:modelValue", {
        ...props.modelValue,
        crs: inputValue(event),
    });
}

function inputValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
}
</script>
