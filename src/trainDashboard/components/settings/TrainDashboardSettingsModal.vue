<template>
    <div class="absolute top-5 right-6 z-30">
        <button
            class="appButton appButton--secondary gap-2 rounded-lg border-line bg-surface p-1 text-xs text-ink-muted shadow-sm hover:bg-surface-muted sm:px-3 sm:py-2 sm:text-base"
            type="button"
            @click="isOpen = true"
        >
            <AppIcon class="size-4" name="settings" />
            Settings
        </button>

        <Modal
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
                    v-model:hasUnsavedChanges="hasUnsavedChanges"
                    class="p-5"
                    @saved="isOpen = false"
                    @valid-change="isConfigurationValid = $event"
                />
            </div>
            <div
                v-show="activeSection === 'api'"
                id="settings-panel-api"
                aria-labelledby="settings-tab-api"
                role="tabpanel"
            >
                <ApiSettings class="p-5" />
            </div>

            <template #footer>
                <div class="flex justify-end gap-3">
                    <button
                        class="appButton appButton--secondary px-4"
                        type="button"
                        :disabled="!hasUnsavedChanges"
                        @click="cancelConfiguration"
                    >
                        Cancel
                    </button>
                    <button
                        class="appButton appButton--primary px-4"
                        type="button"
                        :disabled="!hasUnsavedChanges || !isConfigurationValid"
                        @click="journeySettings?.save()"
                    >
                        Save configuration
                    </button>
                </div>
            </template>
        </Modal>
    </div>
</template>

<script setup lang="ts">
import {ref} from "vue";
import AppIcon from "@/components/AppIcon.vue";
import AppTabs from "@/components/AppTabs.vue";
import Modal from "@/components/Modal/Modal.vue";
import ApiSettings from "./api/ApiSettings.vue";
import JourneySettings from "./JourneySettings.vue";

interface JourneySettingsHandle {
    cancel: () => void;
    save: () => void;
}

const isOpen = ref(false);
const hasUnsavedChanges = ref(false);
const isConfigurationValid = ref(true);
const journeySettings = ref<JourneySettingsHandle | null>(null);
const activeSection = ref("journeys");
const sections = [
    {value: "journeys", label: "Journeys", icon: "train" as const},
    {value: "api", label: "API", icon: "key" as const},
];

function cancelConfiguration(): void {
    journeySettings.value?.cancel();
    isOpen.value = false;
}

function closeSettings(): void {
    journeySettings.value?.cancel();
    isOpen.value = false;
}
</script>
