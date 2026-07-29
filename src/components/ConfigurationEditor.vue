<template>
    <form
        class="space-y-6"
        @change="markDirty"
        @input="markDirty"
        @submit.prevent="save"
    >
        <div>
            <h2 class="font-semibold">Station groups</h2>
            <p class="mt-1 text-sm text-[#687477]">
                A group expands to each station when the dashboard builds
                journeys.
            </p>
        </div>

        <div
            v-for="(group, groupIndex) in draft.groups"
            :key="group.id"
            class="rounded-lg border border-[#cbc8c0] bg-[#ebe8df] p-3"
        >
            <div class="flex items-end gap-3">
                <label class="grow">
                    <span class="mb-1 block text-xs text-[#687477]">
                        Group name
                    </span>
                    <input
                        v-model="group.name"
                        class="w-full rounded border border-[#b9b6ae] bg-white px-2 py-1.5"
                    />
                </label>
                <button
                    class="rounded px-2 py-1.5 text-sm text-[#9d3f37] hover:bg-[#f2efe7]"
                    type="button"
                    @click="removeGroup(groupIndex)"
                >
                    Remove group
                </button>
            </div>

            <div class="mt-3 space-y-2">
                <div
                    v-for="(station, stationIndex) in group.stations"
                    :key="stationIndex"
                    class="grid grid-cols-[minmax(0,1fr)_8rem_auto] items-end gap-2"
                >
                    <label>
                        <span class="mb-1 block text-xs text-[#687477]">
                            Station
                        </span>
                        <input
                            v-model="station.crs"
                            class="w-full rounded border border-[#b9b6ae] bg-white px-2 py-1.5 uppercase"
                            list="station-code-options"
                            placeholder="CRS code"
                            @input="station.crs = station.crs.toUpperCase()"
                        />
                    </label>
                    <label>
                        <span class="mb-1 block text-xs text-[#687477]">
                            Walk minutes
                        </span>
                        <input
                            class="w-full rounded border border-[#b9b6ae] bg-white px-2 py-1.5"
                            min="0"
                            type="number"
                            :value="station.walkMinutes ?? ''"
                            @input="
                                setGroupWalkMinutes(
                                    groupIndex,
                                    stationIndex,
                                    $event
                                )
                            "
                        />
                    </label>
                    <button
                        class="rounded px-2 py-1.5 text-[#9d3f37] hover:bg-[#f2efe7]"
                        type="button"
                        aria-label="Remove station"
                        @click="
                            group.stations.splice(stationIndex, 1);
                            markDirty();
                        "
                    >
                        ×
                    </button>
                </div>
            </div>

            <button
                class="mt-3 rounded border border-[#aaa69d] px-2 py-1 text-sm hover:bg-[#f2efe7]"
                type="button"
                @click="
                    group.stations.push({
                        crs: '',
                        walkMinutes: undefined,
                    });
                    markDirty();
                "
            >
                Add station
            </button>
        </div>

        <button
            class="rounded border border-[#aaa69d] px-3 py-1.5 text-sm hover:bg-[#ebe8df]"
            type="button"
            @click="addGroup"
        >
            Add station group
        </button>

        <div>
            <h2 class="font-semibold">Station pairs</h2>
            <p class="mt-1 text-sm text-[#687477]">
                Each pair has one direction. Add the reverse direction as a
                separate pair.
            </p>
        </div>

        <div
            v-for="(pair, pairIndex) in draft.pairs"
            :key="pair.id"
            class="rounded-lg border border-[#cbc8c0] bg-[#ebe8df] p-3"
        >
            <div class="mb-3 flex items-center justify-between gap-3">
                <strong>{{ pairName(pair) }}</strong>
                <button
                    class="rounded px-2 py-1 text-sm text-[#9d3f37] hover:bg-[#f2efe7]"
                    type="button"
                    @click="removePair(pairIndex)"
                >
                    Remove pair
                </button>
            </div>
            <div class="space-y-3">
                <fieldset>
                    <legend class="mb-1 text-sm font-semibold">From</legend>
                    <LocationReferenceInput
                        v-model="pair.origin"
                        :groups="draft.groups"
                    />
                </fieldset>
                <fieldset>
                    <legend class="mb-1 text-sm font-semibold">To</legend>
                    <LocationReferenceInput
                        v-model="pair.destination"
                        :groups="draft.groups"
                    />
                </fieldset>
            </div>
        </div>

        <button
            class="rounded border border-[#aaa69d] px-3 py-1.5 text-sm hover:bg-[#ebe8df] cursor-pointer"
            type="button"
            @click="addPair"
        >
            Add station pair
        </button>

        <div>
            <h2 class="font-semibold">Priority schedules</h2>
            <p class="mt-1 text-sm text-[#687477]">
                A schedule controls which pairs are primary at a time of day.
            </p>
        </div>

        <div
            v-for="(schedule, scheduleIndex) in draft.schedules"
            :key="schedule.id"
            class="rounded-lg border border-[#cbc8c0] bg-[#ebe8df] p-3"
        >
            <div
                class="grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_7rem_7rem_auto]"
            >
                <label>
                    <span class="mb-1 block text-xs text-[#687477]">
                        Schedule name
                    </span>
                    <input
                        v-model="schedule.name"
                        class="w-full rounded border border-[#b9b6ae] bg-white px-2 py-1.5"
                    />
                </label>
                <label>
                    <span class="mb-1 block text-xs text-[#687477]">
                        Start
                    </span>
                    <input
                        v-model="schedule.startsAt"
                        class="w-full rounded border border-[#b9b6ae] bg-white px-2 py-1.5"
                        inputmode="numeric"
                        placeholder="HH:MM"
                    />
                </label>
                <label>
                    <span class="mb-1 block text-xs text-[#687477]"> End </span>
                    <input
                        v-model="schedule.endsAt"
                        class="w-full rounded border border-[#b9b6ae] bg-white px-2 py-1.5"
                        inputmode="numeric"
                        placeholder="HH:MM"
                    />
                </label>
                <button
                    class="rounded px-2 py-1.5 text-sm text-[#9d3f37] hover:bg-[#f2efe7]"
                    type="button"
                    @click="
                        draft.schedules.splice(scheduleIndex, 1);
                        markDirty();
                    "
                >
                    Remove
                </button>
            </div>

            <fieldset class="mt-3">
                <legend class="text-xs text-[#687477]">Days</legend>
                <div class="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                    <label
                        v-for="day in days"
                        :key="day.value"
                        class="flex items-center gap-1 text-sm"
                    >
                        <input
                            v-model="schedule.days"
                            type="checkbox"
                            :value="day.value"
                        />
                        {{ day.label }}
                    </label>
                </div>
            </fieldset>

            <div class="mt-3 grid gap-4 sm:grid-cols-2">
                <fieldset>
                    <legend class="text-xs text-[#687477]">
                        Primary pairs
                    </legend>
                    <label
                        v-for="pair in draft.pairs"
                        :key="pair.id"
                        class="mt-1 flex items-center gap-2 text-sm"
                    >
                        <input
                            v-model="schedule.primaryPairIds"
                            type="checkbox"
                            :value="pair.id"
                            :disabled="
                                schedule.secondaryPairIds.includes(pair.id)
                            "
                        />
                        {{ pairName(pair) }}
                    </label>
                </fieldset>
                <fieldset>
                    <legend class="text-xs text-[#687477]">
                        Secondary pairs
                    </legend>
                    <label
                        v-for="pair in draft.pairs"
                        :key="pair.id"
                        class="mt-1 flex items-center gap-2 text-sm"
                    >
                        <input
                            v-model="schedule.secondaryPairIds"
                            type="checkbox"
                            :value="pair.id"
                            :disabled="
                                schedule.primaryPairIds.includes(pair.id)
                            "
                        />
                        {{ pairName(pair) }}
                    </label>
                </fieldset>
            </div>
        </div>

        <button
            class="rounded border border-[#aaa69d] px-3 py-1.5 text-sm hover:bg-[#ebe8df]"
            type="button"
            @click="addSchedule"
        >
            Add priority schedule
        </button>

        <datalist id="station-code-options">
            <option
                v-for="[code, name] in stationOptions"
                :key="code"
                :value="code"
            >
                {{ name }}
            </option>
        </datalist>

        <div
            v-if="errors.length"
            class="rounded border border-[#b2483e] bg-[#f8e7e4] p-3 text-sm text-[#7c302a]"
            role="alert"
        >
            <p class="font-semibold">The configuration was not saved.</p>
            <ul class="mt-1 list-disc pl-5">
                <li v-for="error in errors" :key="error">
                    {{ error }}
                </li>
            </ul>
        </div>
        <p v-else-if="saved" class="text-sm text-[#176269]" role="status">
            The configuration is saved in this browser.
        </p>

        <div class="flex flex-wrap gap-3">
            <button
                class="rounded bg-[#176269] px-4 py-2 font-semibold text-white hover:bg-[#104e53]"
                type="submit"
            >
                Save configuration
            </button>
            <button
                class="rounded border border-[#aaa69d] px-4 py-2 hover:bg-[#ebe8df]"
                type="button"
                @click="reset"
            >
                Restore defaults
            </button>
        </div>
    </form>
</template>

<script setup lang="ts">
import {ref} from "vue";
import type {
    DashboardConfig,
    Day,
    LocationReference,
    StationPair,
} from "../config/dashboardConfig";
import {stationName, stationNames} from "../stations";
import {useDashboardConfigStore} from "../stores/dashboardConfig";
import LocationReferenceInput from "./LocationReferenceInput.vue";

const configStore = useDashboardConfigStore();
const draft = ref<DashboardConfig>(cloneConfig(configStore.config));
const errors = ref<string[]>([]);
const saved = ref(false);

const days: Array<{value: Day; label: string}> = [
    {value: 1, label: "Mon"},
    {value: 2, label: "Tue"},
    {value: 3, label: "Wed"},
    {value: 4, label: "Thu"},
    {value: 5, label: "Fri"},
    {value: 6, label: "Sat"},
    {value: 0, label: "Sun"},
];
const stationOptions = Object.entries(stationNames);

function save(): void {
    const result = configStore.saveConfig(draft.value);
    errors.value = result.errors;
    saved.value = result.success;

    if (result.success) {
        draft.value = cloneConfig(configStore.config);
    }
}

function reset(): void {
    configStore.resetConfig();
    draft.value = cloneConfig(configStore.config);
    errors.value = [];
    saved.value = true;
}

function addGroup(): void {
    draft.value.groups.push({
        id: newId("group"),
        name: "New group",
        stations: [{crs: ""}],
    });
    saved.value = false;
}

function markDirty(): void {
    errors.value = [];
    saved.value = false;
}

function removeGroup(groupIndex: number): void {
    const groupId = draft.value.groups[groupIndex]!.id;
    const removedPairIds = draft.value.pairs
        .filter(
            (pair) =>
                referencesGroup(pair.origin, groupId) ||
                referencesGroup(pair.destination, groupId)
        )
        .map((pair) => pair.id);

    draft.value.groups.splice(groupIndex, 1);
    draft.value.pairs = draft.value.pairs.filter(
        (pair) => !removedPairIds.includes(pair.id)
    );
    removePairIdsFromSchedules(removedPairIds);
    saved.value = false;
}

function setGroupWalkMinutes(
    groupIndex: number,
    stationIndex: number,
    event: Event
): void {
    const value = (event.target as HTMLInputElement).value;
    const station = draft.value.groups[groupIndex]!.stations[stationIndex]!;
    station.walkMinutes = value === "" ? undefined : Number(value);
}

function addPair(): void {
    draft.value.pairs.push({
        id: newId("pair"),
        origin: defaultLocation(),
        destination: defaultLocation(),
    });
    saved.value = false;
}

function removePair(pairIndex: number): void {
    const pairId = draft.value.pairs[pairIndex]!.id;
    draft.value.pairs.splice(pairIndex, 1);
    removePairIdsFromSchedules([pairId]);
    saved.value = false;
}

function addSchedule(): void {
    draft.value.schedules.push({
        id: newId("schedule"),
        name: "New schedule",
        days: [1, 2, 3, 4, 5],
        startsAt: "09:00",
        endsAt: "17:00",
        primaryPairIds: [],
        secondaryPairIds: [],
    });
    saved.value = false;
}

function pairName(pair: StationPair): string {
    return `${locationName(pair.origin)} → ${locationName(pair.destination)}`;
}

function locationName(location: LocationReference): string {
    if (location.type === "station") {
        return stationName(location.crs);
    }

    return (
        draft.value.groups.find((group) => group.id === location.groupId)
            ?.name ?? "Missing group"
    );
}

function defaultLocation(): LocationReference {
    const groupId = draft.value.groups.at(0)?.id;
    return groupId ? {type: "group", groupId} : {type: "station", crs: ""};
}

function referencesGroup(
    location: LocationReference,
    groupId: string
): boolean {
    return location.type === "group" && location.groupId === groupId;
}

function removePairIdsFromSchedules(pairIds: string[]): void {
    for (const schedule of draft.value.schedules) {
        schedule.primaryPairIds = schedule.primaryPairIds.filter(
            (pairId) => !pairIds.includes(pairId)
        );
        schedule.secondaryPairIds = schedule.secondaryPairIds.filter(
            (pairId) => !pairIds.includes(pairId)
        );
    }
}

function newId(prefix: string): string {
    const suffix = Math.random().toString(36).slice(2, 10);
    return `${prefix}-${suffix}`;
}

function cloneConfig(config: DashboardConfig): DashboardConfig {
    return JSON.parse(JSON.stringify(config)) as DashboardConfig;
}
</script>
