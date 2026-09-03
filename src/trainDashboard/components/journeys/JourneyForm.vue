<template>
    <form
        class="max-w-[calc(100vw-2rem)] space-y-3 rounded-lg border border-line bg-paper p-3 shadow-sm"
        @submit.prevent="submit"
    >
        <JourneyMaker
            ref="journeyMaker"
            v-model:journey="journey"
            :endpointMode="endpointMode"
            :stationGroups="stationGroups"
            :journeys="journeys"
            originLabel="From"
            destinationLabel="To"
        />
        <div class="flex gap-2">
            <button
                class="appButton appButton--primary py-1.5"
                type="submit"
                :disabled="!validJourney"
            >
                {{ submitLabel }}
            </button>
            <button
                class="appButton appButton--quiet py-1.5"
                type="button"
                @click="emit('cancel')"
            >
                Cancel
            </button>
        </div>
    </form>
</template>

<script setup lang="ts">
import {computed, onMounted, ref, toRaw} from "vue";
import {
    JourneyFieldsSchema,
    type Journey,
    type JourneyFields,
} from "../../dto/journey.dto";
import type {StationGroup} from "../../dto/stationGroup.dto";
import JourneyMaker from "./JourneyMaker.vue";

const props = withDefaults(
    defineProps<{
        initialJourney?: Journey;
        endpointMode?: "locations" | "stations";
        stationGroups?: StationGroup[];
        journeys?: Journey[];
        submitLabel?: string;
    }>(),
    {
        initialJourney: undefined,
        endpointMode: "stations",
        stationGroups: () => [],
        journeys: () => [],
        submitLabel: "Use journey",
    }
);

const emit = defineEmits<{
    cancel: [];
    submit: [journey: JourneyFields];
}>();
const journeyMaker = ref<InstanceType<typeof JourneyMaker>>();

const journey = ref<Journey>(
    props.initialJourney
        ? structuredClone(toRaw(props.initialJourney))
        : {
              id: "ephemeral-journey",
              origin: {type: "station", crs: ""},
              destination: {type: "station", crs: ""},
          }
);
const validJourney = computed(
    () => JourneyFieldsSchema.safeParse(journey.value).success
);

onMounted(() => {
    journeyMaker.value?.focusOrigin();
});

function submit(): void {
    const result = JourneyFieldsSchema.safeParse(journey.value);

    if (!result.success) {
        return;
    }

    emit("submit", result.data);
}
</script>
