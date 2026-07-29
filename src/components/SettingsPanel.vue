<template>
    <details class="absolute top-5 right-6 z-30">
        <summary
            class="flex cursor-pointer list-none items-center gap-2 rounded-lg border border-[#cbc8c0] bg-[#ebe8df] px-3 py-2 font-semibold text-[#485457] shadow-sm hover:bg-[#e3e0d7] [&::-webkit-details-marker]:hidden"
        >
            <AppIcon class="size-4" name="settings" />
            Settings
        </summary>

        <div
            class="absolute top-[calc(100%+0.5rem)] right-0 max-h-[calc(100vh-6rem)] w-[min(48rem,calc(100vw-3rem))] overflow-y-auto rounded-xl border border-[#b9b6ae] bg-[#f2efe7] shadow-xl"
        >
            <div
                class="sticky top-0 z-10 flex items-center justify-between border-b border-[#cbc8c0] bg-[#ebe8df] px-4 py-3"
            >
                <h1 class="text-lg font-semibold">Settings</h1>
                <nav class="flex gap-1" aria-label="Settings sections">
                    <button
                        v-for="section in sections"
                        :key="section.id"
                        class="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold"
                        :class="
                            activeSection === section.id
                                ? 'bg-[#176269] text-white'
                                : 'text-[#485457] hover:bg-[#dedbd3]'
                        "
                        type="button"
                        @click="activeSection = section.id"
                    >
                        <AppIcon class="size-4" :name="section.icon" />
                        {{ section.label }}
                    </button>
                </nav>
            </div>

            <ConfigurationEditor
                v-if="activeSection === 'journeys'"
                class="p-5"
            />
            <ApiSettings v-else class="p-5" />
        </div>
    </details>
</template>

<script setup lang="ts">
import {ref} from "vue";
import ApiSettings from "./ApiSettings.vue";
import AppIcon from "./AppIcon.vue";
import ConfigurationEditor from "./ConfigurationEditor.vue";

type SettingsSection = "api" | "journeys";

const activeSection = ref<SettingsSection>("journeys");
const sections: Array<{
    id: SettingsSection;
    label: string;
    icon: "key" | "train";
}> = [
    {id: "journeys", label: "Journeys", icon: "train"},
    {id: "api", label: "API", icon: "key"},
];
</script>
