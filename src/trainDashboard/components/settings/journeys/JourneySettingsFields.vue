<template>
    <div class="space-y-2">
        <div class="flex flex-wrap items-end gap-x-2 gap-y-3">
            <LocationReferenceInput
                v-model="journey.origin"
                :stationGroups="stationGroups"
                :excludedGroupId="excludedGroupIdForOrigin"
                :excludedCrs="excludedCrsForOrigin"
                :excludedLocationKeys="excludedOriginKeys"
                label="Start the journey from"
            />
            <LocationReferenceInput
                v-model="journey.destination"
                :stationGroups="stationGroups"
                :excludedGroupId="excludedGroupIdForDestination"
                :excludedCrs="excludedCrsForDestination"
                :excludedLocationKeys="excludedDestinationKeys"
                label="finish at"
            />

            <template v-if="journey.viaCrs !== undefined">
                <label class="sentenceField">
                    possibly connecting through
                    <StationInput
                        v-model="journey.viaCrs"
                        class="sentenceField__control min-w-52 grow"
                    />
                </label>
                <button
                    class="appButton appButton--quiet px-0 py-1 text-xs text-danger hover:text-danger-dark"
                    type="button"
                    @click="removeConnectingStation"
                >
                    Remove connection
                </button>
            </template>
            <button
                v-else
                class="appButton appButton--quiet px-0 py-1 text-xs text-primary underline underline-offset-2"
                type="button"
                @click="addConnectingStation"
            >
                Add a connecting station
            </button>
        </div>

        <p v-if="scheduleNames.length > 1" class="text-xs text-ink-subtle">
            Used by {{ scheduleNames.length }} schedules:
            {{ scheduleNames.join(", ") }}. Changes apply to all of them.
        </p>
        <p v-if="journey.viaCrs !== undefined" class="text-xs text-ink-subtle">
            The dashboard allows at least 3 minutes to change trains. It can't
            check the station’s official minimum connection time.
        </p>

        <button
            v-if="canRemove"
            class="appButton appButton--quiet px-0 py-1 text-xs text-danger hover:text-danger-dark"
            type="button"
            @click="emit('remove')"
        >
            <AppIcon class="size-3.5" name="trash" />
            Remove journey from schedule
        </button>
    </div>
</template>

<script setup lang="ts">
import {computed} from "vue";
import AppIcon from "@/components/AppIcon.vue";
import type {
    Journey,
    LocationReference,
    StationGroup,
} from "../../../dto/dashboardConfig.dto";
import LocationReferenceInput from "./LocationReferenceInput.vue";
import StationInput from "../stationGroups/StationInput.vue";

const props = withDefaults(
    defineProps<{
        stationGroups: StationGroup[];
        journeys: Journey[];
        scheduleNames: string[];
        canRemove?: boolean;
    }>(),
    {canRemove: true}
);

const journey = defineModel<Journey>("journey", {required: true});

const excludedCrsForOrigin = computed(() =>
    journey.value.destination.type === "station"
        ? journey.value.destination.crs
        : undefined
);
const excludedCrsForDestination = computed(() =>
    journey.value.origin.type === "station"
        ? journey.value.origin.crs
        : undefined
);
const excludedGroupIdForOrigin = computed(
    () => journey.value.destination.groupId || undefined
);
const excludedGroupIdForDestination = computed(
    () => journey.value.origin.groupId || undefined
);
const otherJourneys = computed(() =>
    props.journeys.filter((candidate) => candidate.id !== journey.value.id)
);
const excludedOriginKeys = computed(() => {
    if (journey.value.destination.groupId === "") {
        return [];
    }

    const destinationKey = getLocationKey(journey.value.destination);

    return otherJourneys.value
        .filter(
            (candidate) =>
                getLocationKey(candidate.destination) === destinationKey
        )
        .map((candidate) => getLocationKey(candidate.origin));
});
const excludedDestinationKeys = computed(() => {
    if (journey.value.origin.groupId === "") {
        return [];
    }

    const originKey = getLocationKey(journey.value.origin);

    return otherJourneys.value
        .filter((candidate) => getLocationKey(candidate.origin) === originKey)
        .map((candidate) => getLocationKey(candidate.destination));
});

const emit = defineEmits<{
    changed: [];
    remove: [];
}>();

function addConnectingStation(): void {
    journey.value.viaCrs = "";
    emit("changed");
}

function removeConnectingStation(): void {
    delete journey.value.viaCrs;
    emit("changed");
}

function getLocationKey(location: LocationReference): string {
    const group = props.stationGroups.find(
        (candidate) => candidate.id === location.groupId
    );

    if (location.type === "group" || group?.stations.length === 1) {
        return `group:${location.groupId}`;
    }

    return `station:${location.groupId}:${location.crs}`;
}
</script>
