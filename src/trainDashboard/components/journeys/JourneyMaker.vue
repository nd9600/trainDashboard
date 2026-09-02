<template>
    <div class="space-y-2">
        <div class="flex flex-wrap items-end gap-x-2 gap-y-3">
            <template v-if="endpointMode === 'locations'">
                <LocationReferenceInput
                    ref="originLocationInput"
                    v-model="journey.origin"
                    :stationGroups="stationGroups"
                    :excludedGroupId="excludedGroupIdForOrigin"
                    :excludedCrs="excludedCrsForOrigin"
                    :excludedLocationKeys="excludedOriginKeys"
                    :label="originLabel"
                />
                <LocationReferenceInput
                    v-model="journey.destination"
                    :stationGroups="stationGroups"
                    :excludedGroupId="excludedGroupIdForDestination"
                    :excludedCrs="excludedCrsForDestination"
                    :excludedLocationKeys="excludedDestinationKeys"
                    :label="destinationLabel"
                />
            </template>
            <template v-else>
                <label class="block space-y-1 text-xs text-ink-muted">
                    <span>{{ originLabel }}</span>
                    <StationInput
                        ref="originStationInput"
                        v-model="originCrs"
                        class="min-w-84"
                        :excludedCrsCodes="
                            destinationCrs ? [destinationCrs] : []
                        "
                    />
                </label>
                <label class="block space-y-1 text-xs text-ink-muted">
                    <span>{{ destinationLabel }}</span>
                    <StationInput
                        v-model="destinationCrs"
                        class="min-w-84"
                        :excludedCrsCodes="originCrs ? [originCrs] : []"
                    />
                </label>
            </template>

            <template v-if="journey.viaCrs !== undefined">
                <label class="sentenceField">
                    possibly connecting through
                    <StationInput
                        ref="connectingStationInput"
                        v-model="journey.viaCrs"
                        class="sentenceField__control min-w-52 grow"
                        :excludedCrsCodes="connectingStationExclusions"
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
                ref="addConnectionButton"
                class="appButton appButton--quiet px-0 py-1 text-xs text-primary underline underline-offset-2"
                type="button"
                @click="addConnectingStation"
            >
                Add a connecting station
            </button>
        </div>

        <p v-if="journey.viaCrs !== undefined" class="text-xs text-ink-subtle">
            The dashboard allows at least 3 minutes to change trains. It can't
            check the station’s official minimum connection time.
        </p>
    </div>
</template>

<script setup lang="ts">
import {computed, nextTick, ref} from "vue";
import type {
    Journey,
    LocationReference,
    StationGroup,
} from "../../dto/dashboardConfig.dto";
import LocationReferenceInput from "../settings/journeys/LocationReferenceInput.vue";
import StationInput from "../settings/stationGroups/StationInput.vue";

const props = withDefaults(
    defineProps<{
        endpointMode: "locations" | "stations";
        originLabel: string;
        destinationLabel: string;
        stationGroups?: StationGroup[];
        journeys?: Journey[];
    }>(),
    {
        stationGroups: () => [],
        journeys: () => [],
    }
);

const journey = defineModel<Journey>("journey", {required: true});
const emit = defineEmits<{changed: []}>();
const originLocationInput = ref<InstanceType<typeof LocationReferenceInput>>();
const originStationInput = ref<InstanceType<typeof StationInput>>();
const connectingStationInput = ref<InstanceType<typeof StationInput>>();
const addConnectionButton = ref<HTMLButtonElement | null>(null);

const originCrs = computed({
    get: () =>
        journey.value.origin.type === "station" ? journey.value.origin.crs : "",
    set: (crs: string) => {
        journey.value.origin = {type: "station", crs};
    },
});
const destinationCrs = computed({
    get: () =>
        journey.value.destination.type === "station"
            ? journey.value.destination.crs
            : "",
    set: (crs: string) => {
        journey.value.destination = {type: "station", crs};
    },
});
const connectingStationExclusions = computed(() =>
    [originCrs.value, destinationCrs.value].filter((crs) => crs !== "")
);
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

async function addConnectingStation(): Promise<void> {
    journey.value.viaCrs = "";
    emit("changed");
    await nextTick();
    connectingStationInput.value?.focus();
}

async function removeConnectingStation(): Promise<void> {
    delete journey.value.viaCrs;
    emit("changed");
    await nextTick();
    addConnectionButton.value?.focus();
}

function getLocationKey(location: LocationReference): string {
    if (location.type === "station" && location.groupId === undefined) {
        return `station:${location.crs}`;
    }

    const group = props.stationGroups.find(
        (candidate) => candidate.id === location.groupId
    );

    if (location.type === "group" || group?.stations.length === 1) {
        return `group:${location.groupId}`;
    }

    return `station:${location.groupId}:${location.crs}`;
}

function focusOrigin(): void {
    if (props.endpointMode === "locations") {
        originLocationInput.value?.focus();
        return;
    }

    originStationInput.value?.focus();
}

defineExpose({focusOrigin});
</script>
