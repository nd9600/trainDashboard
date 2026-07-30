import {defineStore} from "pinia";
import {ref} from "vue";
import {useLocalStorageTyped} from "@/composables/useLocalStorageTyped";
import {
    dashboardConfigErrorMessages,
    dashboardConfigSchema,
    type DashboardConfig,
} from "../dto/dashboardConfig.dto";
import {defaultDashboardConfig} from "../config/defaultDashboardConfig";

interface SaveResult {
    success: boolean;
    errors: string[];
}

const storage = useLocalStorageTyped(
    "train-dashboard-config-v1",
    dashboardConfigSchema,
    defaultDashboardConfig
);

export const useTrainDashboardStore = defineStore("dashboard-config", () => {
    const config = ref<DashboardConfig>(storage.loadFromLocalStorage());

    function saveConfig(candidate: unknown): SaveResult {
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

    function resetConfig(): void {
        saveConfig(structuredClone(defaultDashboardConfig));
    }

    return {config, resetConfig, saveConfig};
});
