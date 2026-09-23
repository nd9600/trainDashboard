import {defineStore} from "pinia";
import {ref} from "vue";
import {useLocalStorageTyped} from "@/composables/useLocalStorageTyped";
import {RailDataApiSettingsSchema, type RailDataApiSettings} from "../dto/railDataApiSettings.dto";

const storage = useLocalStorageTyped("train-dashboard-rail-data-api", RailDataApiSettingsSchema, {
    consumerKey: "",
});

export const useRailDataApiStore = defineStore("rail-data-api", () => {
    const settings = ref<RailDataApiSettings>(storage.loadFromLocalStorage());

    function saveApiSettings(candidate: RailDataApiSettings): void {
        //todo: do we need to parse the candidate (maybe so its not actually the same object as in the store?), or can we just do settings.value = candidate
        const parsedSettings = RailDataApiSettingsSchema.parse(candidate);
        settings.value = parsedSettings;
        storage.saveToLocalStorage(parsedSettings);
    }

    return {settings, saveApiSettings};
});
