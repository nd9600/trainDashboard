<template>
    <section
        id="journey-settings-panel-walk-times"
        class="space-y-4"
        aria-labelledby="journey-settings-tab-walk-times"
        role="tabpanel"
    >
        <div>
            <h2 class="font-semibold">Walk times</h2>
            <p class="mt-1 text-sm text-ink-subtle">
                Enter the walking time between each place and station. Leave a
                value blank to hide related walking advice.
            </p>
        </div>

        <WalkTimeSettingsCard
            v-for="(group, groupIndex) in stationGroups"
            :key="group.id"
            v-model:group="stationGroups[groupIndex]!"
            @changed="emit('changed')"
        />
    </section>
</template>

<script setup lang="ts">
import type {StationGroup} from "../../../dto/dashboardConfig.dto";
import WalkTimeSettingsCard from "./WalkTimeSettingsCard.vue";

const stationGroups = defineModel<StationGroup[]>("stationGroups", {
    required: true,
});

const emit = defineEmits<{
    changed: [];
}>();
</script>
