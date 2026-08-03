<template>
    <div ref="root" class="relative">
        <Combobox
            :modelValue="selectedCode"
            nullable
            @update:model-value="selectStation"
        >
            <ComboboxInput
                v-bind="$attrs"
                class="appInput text-xs sm:text-base pr-9"
                aria-label="Station"
                :aria-invalid="!isValidStation"
                :displayValue="displayStation"
                placeholder="Search by station name or CRS code"
                required
                @change="updateQuery"
            />
            <ComboboxButton
                class="appButton appButton--quiet px-1 py-1 absolute right-[5px] top-[5px] text-ink-subtle hover:text-ink"
                type="button"
                aria-label="Show station options"
            >
                <AppIcon class="size-4 rotate-90" name="chevron" />
            </ComboboxButton>

            <ComboboxOptions
                class="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded border border-line-strong bg-paper py-1 shadow-lg"
            >
                <ComboboxOption
                    v-for="station in filteredStations"
                    :key="station.code"
                    v-slot="{active, selected}"
                    as="template"
                    :value="station.code"
                >
                    <li
                        class="cursor-pointer px-3 py-2 text-sm"
                        :class="{
                            'bg-primary text-paper': active,
                            'font-semibold': selected,
                        }"
                    >
                        {{ station.label }}
                    </li>
                </ComboboxOption>
                <li
                    v-if="filteredStations.length === 0"
                    class="px-3 py-2 text-sm text-ink-subtle"
                >
                    No stations found.
                </li>
            </ComboboxOptions>
        </Combobox>
    </div>
</template>

<script setup lang="ts">
import {
    Combobox,
    ComboboxButton,
    ComboboxInput,
    ComboboxOption,
    ComboboxOptions,
} from "@headlessui/vue";
import AppIcon from "@/components/AppIcon.vue";
import {computed, ref, watch} from "vue";
import {
    findStationOptions,
    stationCodeFromInput,
    stationDisplayName,
} from "../../../stations/stations";
import {stationNames} from "../../../stations/stationNames";

defineOptions({
    inheritAttrs: false,
});

const props = defineProps<{
    modelValue: string;
}>();

const emit = defineEmits<{
    "update:modelValue": [code: string];
}>();

const root = ref<HTMLDivElement | null>(null);
const query = ref("");
const selectedCode = ref<string | null>(
    stationNames[props.modelValue] ? props.modelValue : null
);
const filteredStations = computed(() => findStationOptions(query.value));
const isValidStation = computed(
    () => stationNames[props.modelValue] !== undefined
);

watch(
    () => props.modelValue,
    (code) => {
        selectedCode.value = stationNames[code] ? code : null;
    }
);

function displayStation(code: unknown): string {
    return typeof code === "string" ? stationDisplayName(code) : "";
}

function updateQuery(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    const code = stationCodeFromInput(value);

    query.value = value;
    selectedCode.value = stationNames[code] ? code : null;
    emit("update:modelValue", code);
}

function selectStation(code: string | null): void {
    if (!code) {
        return;
    }

    query.value = "";
    selectedCode.value = code;
    emit("update:modelValue", code);
    root.value?.dispatchEvent(new Event("input", {bubbles: true}));
}
</script>
