import {ref, type Ref} from "vue";
import {DashboardConfigSchema, type DashboardConfig} from "../../dto/dashboardConfig.dto";
import {dashboardConfigErrorMessages} from "../../dto/dashboardConfigDraft.dto";
import {useDashboardConfigStore} from "../../store/dashboardConfig.store";
import {useJourneySelectionStore} from "../../store/journeySelection.store";

export function useJourneySettingsDraft(
    hasUnsavedChanges: Ref<boolean>,
    onValidityChange: (valid: boolean) => void
) {
    const dashboardConfigStore = useDashboardConfigStore();
    const selection = useJourneySelectionStore();
    const recentJourneyIds = ref([...selection.recentJourneyIds]);
    const form = ref<HTMLFormElement | null>(null);
    const draft = ref<DashboardConfig>(getConfigDraft());
    const errors = ref<string[]>([]);
    const isValid = ref(true);

    function getConfigDraft(): DashboardConfig {
        // The stored configuration is JSON data. Its reactive proxies cannot use structuredClone.
        return JSON.parse(JSON.stringify(dashboardConfigStore.config));
    }

    function save(): void {
        const config = validateDraft();

        if (!config) {
            return;
        }

        for (const group of config.stationGroups) {
            if (group.coordinates) {
                group.coordinates.latitude = Number(group.coordinates.latitude.toFixed(4));
                group.coordinates.longitude = Number(group.coordinates.longitude.toFixed(4));
            }
        }

        const removedJourneyIds = dashboardConfigStore.config.journeys
            .filter((journey) => !config.journeys.some((candidate) => candidate.id === journey.id))
            .map((journey) => journey.id);
        const activeJourneyId = selection.activeJourneyId;
        dashboardConfigStore.saveConfig(config);
        for (const journeyId of selection.recentJourneyIds) {
            if (
                !recentJourneyIds.value.includes(journeyId) ||
                removedJourneyIds.includes(journeyId)
            ) {
                selection.removeRecentJourney(journeyId);
            }
        }
        if (activeJourneyId && removedJourneyIds.includes(activeJourneyId)) {
            selection.clearActiveJourney();
        } else if (
            selection.activeJourney.type === "ephemeral" &&
            config.journeys.some((journey) => journey.id === activeJourneyId)
        ) {
            selection.selectJourney(activeJourneyId!);
        }
        cancel();
    }

    function cancel(): void {
        recentJourneyIds.value = [...selection.recentJourneyIds];
        draft.value = getConfigDraft();
        errors.value = [];
        hasUnsavedChanges.value = false;
        setValid(true);
    }

    function handleChange(): void {
        validateDraft();
        hasUnsavedChanges.value = true;
    }

    function validateDraft(): DashboardConfig | undefined {
        const result = DashboardConfigSchema.safeParse(draft.value);
        errors.value = result.success ? [] : dashboardConfigErrorMessages(result.error, draft.value);

        // Incomplete numbers have an empty value, but are not optional blank fields.
        for (const input of form.value?.querySelectorAll("input") ?? []) {
            if (input.validity.customError) {
                errors.value.push(input.validationMessage);
            } else if (input.validity.badInput) {
                const label = input.labels?.[0]?.textContent?.trim() ?? "Value";
                errors.value.push(`${label}: Enter a number.`);
            }
        }

        setValid(errors.value.length === 0);

        return result.success && errors.value.length === 0 ? result.data : undefined;
    }

    function setValid(value: boolean): void {
        if (isValid.value === value) {
            return;
        }

        isValid.value = value;
        onValidityChange(value);
    }

    function removeGroup(groupIndex: number): void {
        const group = draft.value.stationGroups[groupIndex]!;
        const groupId = group.id;
        const removedJourneyIds = draft.value.journeys
            .filter(
                (journey) =>
                    journey.origin.groupId === groupId || journey.destination.groupId === groupId
            )
            .map((journey) => journey.id);

        const affectedScheduleCount = draft.value.schedules.filter((schedule) =>
            removedJourneyIds.some((journeyId) => schedule.journeyId === journeyId)
        ).length;

        const consequence = removedJourneyIds.length
            ? ` This will also remove ${removedJourneyIds.length} journey${removedJourneyIds.length === 1 ? "" : "s"} and update ${affectedScheduleCount} schedule${affectedScheduleCount === 1 ? "" : "s"}.`
            : "";

        if (!window.confirm(`Remove station group “${group.name}”?${consequence}`)) {
            return;
        }

        draft.value.stationGroups.splice(groupIndex, 1);
        draft.value.journeys = draft.value.journeys.filter(
            (journey) => !removedJourneyIds.includes(journey.id)
        );
        for (const schedule of draft.value.schedules) {
            if (removedJourneyIds.includes(schedule.journeyId)) schedule.journeyId = "";
        }
        handleChange();
    }

    return {draft, recentJourneyIds, form, errors, save, cancel, handleChange, removeGroup};
}
