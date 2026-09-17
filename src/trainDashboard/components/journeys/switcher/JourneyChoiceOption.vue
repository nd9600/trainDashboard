<template>
    <ListboxOption v-slot="{active, selected}" as="template" :value="journey.id">
        <li
            class="group flex cursor-pointer items-center gap-3 px-3 py-2 text-left transition-colors"
            :class="{'bg-surface': active}"
        >
            <span
                class="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border"
                :class="
                    selected
                        ? 'border-primary bg-primary text-paper'
                        : 'border-line-strong text-transparent'
                "
                aria-hidden="true"
                >✓</span
            >
            <span class="min-w-0 grow text-balance font-semibold text-ink">
                <JourneyLabel
                    class="text-xs sm:text-sm sm:whitespace-nowrap"
                    :details="getJourneyLabelDetails(journey, config.stationGroups)"
                    :shouldSayWhenDirect="false"
                />
                <span v-if="selected" class="sr-only">Current journey.</span>
            </span>
            <AppIconButton
                v-if="removeAction"
                class="ml-2 rounded-md px-2 py-2 cursor-pointer border-0 bg-inherit text-ink-subtle sm:opacity-0 group-hover:opacity-100 hover:text-ink hover:bg-paper"
                tabindex="-1"
                :label="removeAction.label"
                icon="close"
                iconClass="size-3.5"
                @click.stop="removeAction.run(journey.id)"
            />
        </li>
    </ListboxOption>
</template>

<script setup lang="ts">
import {computed} from "vue";
import {storeToRefs} from "pinia";
import {ListboxOption} from "@headlessui/vue";
import AppIconButton from "@/components/AppIconButton.vue";
import type {Journey} from "../../../dto/journey.dto";
import type {JourneyChoices} from "../../../dto/journeySelection.dto";
import {getJourneyLabelDetails} from "../../../journeys/journeyLabels";
import {useDashboardConfigStore} from "../../../store/dashboardConfig.store";
import {useJourneySelectionStore} from "../../../store/journeySelection.store";
import JourneyLabel from "../JourneyLabel.vue";

const props = defineProps<{journey: Journey; section: JourneyChoices["name"]}>();
const {config} = storeToRefs(useDashboardConfigStore());
const selection = useJourneySelectionStore();
const removeAction = computed(() => {
    if (props.section === "Recent")
        return {label: "Remove from recent journeys", run: selection.removeRecentJourney};
    if (
        props.section === "Saved" &&
        !config.value.schedules.some((schedule) => schedule.journeyId === props.journey.id)
    ) {
        return {label: "Remove saved journey", run: selection.removeSavedJourney};
    }
    return undefined;
});
</script>
