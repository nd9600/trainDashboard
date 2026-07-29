<template>
    <div class="grid gap-2 sm:grid-cols-[8rem_minmax(0,1fr)_7rem]">
        <label>
            <span class="mb-1 block text-xs text-[#687477]">Type</span>
            <select
                class="w-full rounded border border-[#b9b6ae] bg-white px-2 py-1.5"
                :value="modelValue.type"
                @change="changeType"
            >
                <option value="station">Station</option>
                <option value="group">Station group</option>
            </select>
        </label>

        <label v-if="modelValue.type === 'station'">
            <span class="mb-1 block text-xs text-[#687477]"> Station </span>
            <input
                class="w-full rounded border border-[#b9b6ae] bg-white px-2 py-1.5 uppercase"
                list="station-code-options"
                :value="modelValue.crs"
                placeholder="CRS code"
                @input="updateStationCode"
            />
        </label>
        <label v-else>
            <span class="mb-1 block text-xs text-[#687477]">
                Station group
            </span>
            <select
                class="w-full rounded border border-[#b9b6ae] bg-white px-2 py-1.5"
                :value="modelValue.groupId"
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
            <span class="mb-1 block text-xs text-[#687477]">
                Walk minutes
            </span>
            <input
                class="w-full rounded border border-[#b9b6ae] bg-white px-2 py-1.5"
                min="0"
                type="number"
                :value="modelValue.walkMinutes ?? ''"
                @input="updateWalkMinutes"
            />
        </label>
    </div>
</template>

<script setup lang="ts">
import type {LocationReference, StationGroup} from "../config/dashboardConfig";

const props = defineProps<{
    modelValue: LocationReference;
    groups: StationGroup[];
}>();

const emit = defineEmits<{
    "update:modelValue": [value: LocationReference];
}>();

function changeType(event: Event): void {
    const type = inputValue(event);

    if (type === "group") {
        emit("update:modelValue", {
            type: "group",
            groupId: props.groups.at(0)?.id ?? "",
        });
        return;
    }

    emit("update:modelValue", {type: "station", crs: ""});
}

function updateStationCode(event: Event): void {
    if (props.modelValue.type !== "station") {
        return;
    }

    emit("update:modelValue", {
        ...props.modelValue,
        crs: inputValue(event).toUpperCase(),
    });
}

function updateWalkMinutes(event: Event): void {
    if (props.modelValue.type !== "station") {
        return;
    }

    const value = inputValue(event);
    const walkMinutes = value === "" ? undefined : Number(value);

    emit("update:modelValue", {...props.modelValue, walkMinutes});
}

function updateGroup(event: Event): void {
    emit("update:modelValue", {
        type: "group",
        groupId: inputValue(event),
    });
}

function inputValue(event: Event): string {
    return (event.target as HTMLInputElement | HTMLSelectElement).value;
}
</script>
