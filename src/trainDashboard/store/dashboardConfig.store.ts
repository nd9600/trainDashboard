import {defineStore} from "pinia";
import {ref} from "vue";
import {useLocalStorageTyped} from "@/composables/useLocalStorageTyped";
import {
    dashboardConfigErrorMessages,
    dashboardConfigSchema,
    type DashboardConfig,
} from "../dto/dashboardConfig.dto";

const storage = useLocalStorageTyped(
    "train-dashboard-config-v3",
    dashboardConfigSchema,
    {
        version: 3,
        stationGroups: [],
        journeys: [],
        schedules: [],
    }
);

export const useDashboardConfigStore = defineStore("dashboard-config", () => {
    const config = ref<DashboardConfig>(storage.loadFromLocalStorage());

    function saveConfig(candidate: unknown): {
        success: boolean;
        errors: string[];
    } {
        const result = dashboardConfigSchema.safeParse(candidate);

        if (!result.success) {
            return {
                success: false,
                errors: dashboardConfigErrorMessages(result.error),
            };
        }

        config.value = result.data;
        storage.saveToLocalStorage(result.data);

        return {success: true, errors: []};
    }

    return {config, saveConfig};
});
