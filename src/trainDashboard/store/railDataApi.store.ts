import {defineStore} from "pinia";
import {ref} from "vue";
import {useLocalStorageTyped} from "@/composables/useLocalStorageTyped";
import {
    railDataApiSettingsSchema,
    type RailDataApiSettings,
} from "../dto/railDataApiSettings.dto";

const defaultSettings: RailDataApiSettings = {
    consumerKey: "",
};

const storage = useLocalStorageTyped(
    "train-dashboard-rail-data-api",
    railDataApiSettingsSchema,
    defaultSettings
);

export const useRailDataApiStore = defineStore("rail-data-api", () => {
    const settings = ref<RailDataApiSettings>(storage.loadFromLocalStorage());

    function saveSettings(candidate: RailDataApiSettings): void {
        const parsedSettings = railDataApiSettingsSchema.parse(candidate);
        settings.value = parsedSettings;
        storage.saveToLocalStorage(parsedSettings);
    }

    return {settings, saveSettings};
});
