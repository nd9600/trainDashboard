<template>
    <div class="absolute top-5 right-6 z-30">
        <button
            class="flex items-center gap-2 rounded-lg border border-line bg-surface p-1 sm:px-3 sm:py-2 font-semibold text-ink-muted shadow-sm hover:bg-surface-muted text-xs sm:text-base"
            type="button"
            @click="isOpen = true"
        >
            <AppIcon class="size-4" name="settings" />
            Settings
        </button>

        <AppModal
            :is-open="isOpen"
            :is-closable="true"
            spotlight-variant-placement="top"
            @close="closeSettings"
        >
            <AppModalDialog
                rootClass="sm:w-[min(48rem,calc(100vw-3rem))]"
                :is-closable="true"
                @close="closeSettings"
            >
                <template #header>Settings</template>

                <AppTabs
                    id-prefix="settings"
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
                        class="p-5"
                        @dirty-change="isConfigurationDirty = $event"
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
                            class="rounded border border-line-strong bg-paper px-4 py-2 font-semibold hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40"
                            type="button"
                            :disabled="!isConfigurationDirty"
                            @click="cancelConfiguration"
                        >
                            Cancel
                        </button>
                        <button
                            class="rounded bg-primary px-4 py-2 font-semibold text-paper hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
                            type="button"
                            :disabled="
                                !isConfigurationDirty || !isConfigurationValid
                            "
                            @click="journeySettings?.save()"
                        >
                            Save configuration
                        </button>
                    </div>
                </template>
            </AppModalDialog>
        </AppModal>
    </div>
</template>

<script setup lang="ts">
import {ref} from "vue";
import AppIcon from "@/components/AppIcon.vue";
import AppTabs from "@/components/AppTabs.vue";
import AppModal from "@/components/Modal/AppModal.vue";
import AppModalDialog from "@/components/Modal/AppModalDialog.vue";
import ApiSettings from "./api/ApiSettings.vue";
import JourneySettings from "./JourneySettings.vue";

interface JourneySettingsHandle {
    cancel: () => void;
    save: () => void;
}

const isOpen = ref(false);
const isConfigurationDirty = ref(false);
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
