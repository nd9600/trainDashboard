<template>
    <div>
        <button
            class="appButton appButton--quiet border-gray-300 px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
            type="button"
            data-test="diagnostic-button"
            @click="isOpen = true"
        >
            diagnostic
        </button>

        <AppModal :isOpen="isOpen" closeLabel="Close diagnostic" @close="isOpen = false">
            <template #header>Diagnostic</template>

            <div class="space-y-6 p-5">
                <section v-for="store in stores" :key="store.name">
                    <h2 class="mb-2 text-sm font-semibold">{{ store.name }}</h2>
                    <pre
                        class="overflow-x-auto rounded border border-line bg-paper p-3 text-xs"
                    ><code>{{ store.data }}</code></pre>
                </section>
            </div>
        </AppModal>
    </div>
</template>

<script setup lang="ts">
import {storeToRefs} from "pinia";
import {ref} from "vue";
import AppModal from "@/components/Modal/AppModal.vue";
import {useDashboardClockStore} from "../store/dashboardClock.store";
import {useDashboardConfigStore} from "../store/dashboardConfig.store";
import {useJourneySelectionStore} from "../store/journeySelection.store";
import {useRailDataApiStore} from "../store/railDataApi.store";
import {useTrainServicesStore} from "../store/trainServices.store";

const isOpen = ref(false);
const stores = [
    {name: "dashboardClockStore", data: storeToRefs(useDashboardClockStore())},
    {name: "dashboardConfigStore", data: storeToRefs(useDashboardConfigStore())},
    {name: "journeySelectionStore", data: storeToRefs(useJourneySelectionStore())},
    {name: "railDataApiStore", data: storeToRefs(useRailDataApiStore())},
    {name: "trainServicesStore", data: storeToRefs(useTrainServicesStore())},
];
</script>
