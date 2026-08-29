import {defineStore} from "pinia";
import {ref} from "vue";
import {useLocalStorageTyped} from "@/composables/useLocalStorageTyped";
import {
    RailDataApiSettingsSchema,
    type RailDataApiSettings,
} from "../dto/railDataApiSettings.dto";

const storage = useLocalStorageTyped(
    "train-dashboard-rail-data-api",
    RailDataApiSettingsSchema,
    {consumerKey: ""}
);

export const useRailDataApiStore = defineStore("rail-data-api", () => {
    const settings = ref<RailDataApiSettings>(storage.loadFromLocalStorage());

    function saveSettings(candidate: RailDataApiSettings): void {
        const parsedSettings = RailDataApiSettingsSchema.parse(candidate);
        settings.value = parsedSettings;
        storage.saveToLocalStorage(parsedSettings);
    }

    return {settings, saveSettings};
});
