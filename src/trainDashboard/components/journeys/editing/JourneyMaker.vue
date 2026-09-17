<template>
    <div class="space-y-2">
        <div class="flex flex-wrap items-end gap-x-2 gap-y-3">
            <template v-for="endpoint in endpoints" :key="endpoint.name">
                <LocationReferenceInput
                    v-if="endpointMode === 'locations'"
                    :ref="endpoint.name === 'origin' ? 'originInput' : undefined"
                    v-model="journey[endpoint.name]"
                    :stationGroups="stationGroups"
                    :excludedGroupId="endpoint.opposite.groupId || undefined"
                    :excludedCrs="getCrs(endpoint.opposite)"
                    :excludedLocationKeys="endpoint.excludedKeys"
                    :label="endpoint.label"
                />
                <label v-else class="block space-y-1 text-xs text-ink-muted">
                    <span>{{ endpoint.label }}</span>
                    <StationInput
                        :ref="endpoint.name === 'origin' ? 'originInput' : undefined"
                        :modelValue="getCrs(journey[endpoint.name]) ?? ''"
                        class="min-w-84"
                        :excludedCrsCodes="
                            [getCrs(endpoint.opposite)].filter(
                                (crs): crs is string => crs !== undefined
                            )
                        "
                        @update:modelValue="journey[endpoint.name] = {type: 'station', crs: $event}"
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
            The dashboard allows at least 3 minutes to change trains. It can't check the station’s
            official minimum connection time.
        </p>
    </div>
</template>

<script setup lang="ts">
import {computed, nextTick, ref, useTemplateRef} from "vue";
import type {Journey, LocationReference} from "../../../dto/journey.dto";
import type {StationGroup} from "../../../dto/stationGroup.dto";
import {getLocationKey} from "../../../journeys/journeyIdentity";
import LocationReferenceInput from "./LocationReferenceInput.vue";
import StationInput from "../../stations/StationInput.vue";

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
const originInput =
    useTemplateRef<
        Array<InstanceType<typeof LocationReferenceInput> | InstanceType<typeof StationInput>>
    >("originInput");
const connectingStationInput = ref<InstanceType<typeof StationInput>>();
const addConnectionButton = ref<HTMLButtonElement>();
const endpointNames = ["origin", "destination"] as const;
const endpoints = computed(() =>
    endpointNames.map((name, index) => {
        const oppositeName = endpointNames[1 - index]!;
        const opposite = journey.value[oppositeName];
        const oppositeKey = getLocationKey(opposite, props.stationGroups);
        const excludedKeys = oppositeKey
            ? props.journeys
                  .filter(
                      (candidate) =>
                          candidate.id !== journey.value.id &&
                          getLocationKey(candidate[oppositeName], props.stationGroups) ===
                              oppositeKey
                  )
                  .map((candidate) => getLocationKey(candidate[name], props.stationGroups))
            : [];
        return {
            name,
            opposite,
            excludedKeys,
            label: name === "origin" ? props.originLabel : props.destinationLabel,
        };
    })
);
const connectingStationExclusions = computed(() =>
    endpointNames
        .map((name) => getCrs(journey.value[name]))
        .filter((crs): crs is string => crs !== undefined && crs !== "")
);

function getCrs(location: LocationReference): string | undefined {
    return location.type === "station" ? location.crs : undefined;
}

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

defineExpose({focusOrigin: () => originInput.value?.[0]?.focus()});
</script>
