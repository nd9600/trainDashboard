<template>
    <div ref="root" class="block min-w-0 space-y-1 text-xs text-ink-muted">
        <Combobox v-model="location" :by="sameLocation">
            <ComboboxLabel>{{ label }}</ComboboxLabel>
            <div class="relative">
                <ComboboxInput
                    class="appInput w-84 max-w-full pr-9 text-xs sm:text-base"
                    :aria-label="label"
                    :aria-invalid="!LocationReferenceSchema.safeParse(location).success"
                    :displayValue="displayLocation"
                    placeholder="Search for a station or group"
                    required
                    @change="updateQuery"
                />
                <ComboboxButton
                    class="appButton appButton--quiet absolute right-[5px] top-[5px] px-1 py-1 text-ink-subtle hover:text-ink"
                    :aria-label="`Show ${label.toLowerCase()} options`"
                    @click="query = ''"
                >
                    <AppIcon class="size-4 rotate-90" name="chevron" />
                </ComboboxButton>
                <ComboboxOptions
                    class="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded border border-line-strong bg-paper py-1 shadow-lg"
                >
                    <ComboboxOption
                        v-for="option in options"
                        :key="getLocationKey(option.value)"
                        v-slot="{active, selected}"
                        as="template"
                        :value="option.value"
                    >
                        <li
                            class="cursor-pointer px-3 py-2 text-sm"
                            :class="{'bg-primary text-paper': active, 'font-semibold': selected}"
                        >
                            {{ option.label }}
                        </li>
                    </ComboboxOption>
                    <li v-if="options.length === 0" class="px-3 py-2 text-sm text-ink-subtle">
                        No stations or groups found.
                    </li>
                </ComboboxOptions>
            </div>
        </Combobox>
    </div>
</template>

<script setup lang="ts">
import {
    Combobox,
    ComboboxInput,
    ComboboxLabel,
    ComboboxButton,
    ComboboxOptions,
    ComboboxOption,
} from "@headlessui/vue";
import {computed, ref} from "vue";
import AppIcon from "@/components/AppIcon.vue";
import {LocationReferenceSchema, type LocationReference} from "../../../dto/journey.dto";
import type {StationGroup} from "../../../dto/stationGroup.dto";
import {getLocationKey} from "../../../journeys/journeyIdentity";
import {
    findStationOptions,
    stationCodeFromInput,
    stationDisplayName,
} from "../../../stations/stations";

const props = defineProps<{
    stationGroups: StationGroup[];
    excludedLocation: LocationReference;
    label: string;
}>();
const location = defineModel<LocationReference>({required: true});
const root = ref<HTMLDivElement>();
const query = ref("");
const options = computed(() => {
    const search = query.value.trim().toLowerCase();
    const groups = props.stationGroups
        .filter((group) => group.name.toLowerCase().includes(search))
        .map((group) => ({
            value: {type: "group", groupId: group.id} as LocationReference,
            label: `${group.name} (group)`,
        }));
    const stations = findStationOptions(query.value).map((station) => ({
        value: {type: "station", crs: station.code} as LocationReference,
        label: station.label,
    }));
    return [...groups, ...stations].filter(
        (option) => !sameLocation(option.value, props.excludedLocation)
    );
});

function sameLocation(first: LocationReference, second: LocationReference): boolean {
    return getLocationKey(first) === getLocationKey(second);
}

function displayLocation(value: unknown): string {
    const endpoint = value as LocationReference;
    const group = props.stationGroups.find((group) => group.id === endpoint.groupId);
    if (endpoint.type === "station") {
        const station = stationDisplayName(endpoint.crs);
        return group ? `${group.name} - ${station}` : station;
    }
    return group?.name ?? "";
}

function updateQuery(event: Event): void {
    query.value = (event.target as HTMLInputElement).value;
    location.value = {type: "station", crs: stationCodeFromInput(query.value)};
}

defineExpose({focus: () => root.value?.querySelector("input")?.focus()});
</script>
