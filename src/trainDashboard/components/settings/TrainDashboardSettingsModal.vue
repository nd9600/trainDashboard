<template>
    <div class="z-30">
        <button
            class="appButton appButton--secondary gap-2 rounded-lg border-line bg-surface p-1 text-xs text-ink-muted shadow-sm hover:bg-surface-muted sm:px-3 sm:py-2 sm:text-base"
            type="button"
            @click="isOpen = true"
        >
            <AppIcon class="size-4" name="settings" />
            <span class="max-sm:hidden">Settings</span>
        </button>

        <AppModal
            :isOpen="isOpen"
            :isClosable="true"
            rootClass="sm:w-[min(48rem,calc(100vw-3rem))]"
            spotlightVariantPlacement="top"
            @close="closeSettings"
        >
            <template #header>Settings</template>

            <AppTabs
                idPrefix="settings"
                v-model="activeSection"
                :tabs="sections"
            />
            <div
                v-show="activeSection === 'journeys'"
                id="settings-panel-journeys"
                aria-labelledby="settings-tab-journeys"
                role="tabpanel"
            >
                <JourneySettings
                    ref="journeySettings"
                    v-model:hasUnsavedChanges="hasUnsavedJourneyConfiguration"
                    class="p-5"
                    @valid-change="isConfigurationValid = $event"
                />
            </div>
            <div
                v-show="activeSection === 'api'"
                id="settings-panel-api"
                aria-labelledby="settings-tab-api"
                role="tabpanel"
            >
                <ApiSettings
                    ref="apiSettings"
                    v-model:hasUnsavedChanges="hasUnsavedApiSettings"
                    class="p-5"
                />
            </div>

            <template #footer>
                <div class="flex justify-end gap-3">
                    <button
                        class="appButton appButton--secondary px-4"
                        type="button"
                        :disabled="!hasUnsavedChanges"
                        @click="cancelSettings"
                    >
                        Cancel
                    </button>
                    <button
                        class="appButton appButton--primary px-4"
                        type="button"
                        :disabled="!hasUnsavedChanges || !isConfigurationValid"
                        @click="saveSettings"
                    >
                        Save configuration
                    </button>
                </div>
            </template>
        </AppModal>
    </div>
</template>

<script setup lang="ts">
import {computed, ref} from "vue";
import AppIcon from "@/components/AppIcon.vue";
import AppTabs from "@/components/AppTabs.vue";
import AppModal from "@/components/Modal/AppModal.vue";
import ApiSettings from "./api/ApiSettings.vue";
import JourneySettings from "./JourneySettings.vue";

interface SettingsHandle {
    cancel: () => void;
    save: () => void;
}

const isOpen = ref(false);
const hasUnsavedJourneyConfiguration = ref(false);
const hasUnsavedApiSettings = ref(false);
const isConfigurationValid = ref(true);
const journeySettings = ref<SettingsHandle | null>(null);
const apiSettings = ref<SettingsHandle | null>(null);
const activeSection = ref("journeys");
const hasUnsavedChanges = computed(
    () => hasUnsavedJourneyConfiguration.value || hasUnsavedApiSettings.value
);
const sections = [
    {value: "journeys", label: "Journeys", icon: "train" as const},
    {value: "api", label: "API", icon: "key" as const},
];

function saveSettings(): void {
    if (hasUnsavedJourneyConfiguration.value) {
        journeySettings.value?.save();
    }

    if (hasUnsavedApiSettings.value) {
        apiSettings.value?.save();
    }
}

function cancelSettings(): void {
    journeySettings.value?.cancel();
    apiSettings.value?.cancel();
}

function closeSettings(): void {
    journeySettings.value?.cancel();
    apiSettings.value?.cancel();
    isOpen.value = false;
}
</script>
