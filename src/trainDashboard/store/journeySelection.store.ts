import {defineStore} from "pinia";
import {computed, type ComputedRef, ref} from "vue";
import {useLocalStorageTyped} from "@/composables/useLocalStorageTyped";
import type {Day, Journey, JourneyFields} from "../dto/dashboardConfig.dto";
import {
    createEphemeralJourney,
    journeyMemorySchema,
    type ActiveJourney,
    type JourneyChoiceGroup,
    type JourneyMemory,
} from "../dto/journeySelection.dto";
import {
    type CurrentClock,
    getActiveSchedule,
} from "../journeys/planning/journeySelection";
import {useDashboardConfigStore} from "./dashboardConfig.store";

const memoryStorage = useLocalStorageTyped(
    "train-dashboard-journey-memory-v2",
    journeyMemorySchema,
    {recentJourneyIds: [], ephemeralJourneys: []}
);

export const useJourneySelectionStore = defineStore("journey-selection", () => {
    const dashboardConfigStore = useDashboardConfigStore();
    const savedMemory = memoryStorage.loadFromLocalStorage();
    let predictionRecentJourneyIds = [...savedMemory.recentJourneyIds];

    ///// state /////
    const currentDate = ref(new Date());
    const recentJourneyIds = ref(savedMemory.recentJourneyIds);
    const ephemeralJourneys = ref(savedMemory.ephemeralJourneys);
    const activeJourney = ref<ActiveJourney>({type: "predicted"});
    const previousActiveJourneys: ActiveJourney[] = [];

    ///// getters /////
    const schedules = computed(() => dashboardConfigStore.config.schedules);
    const savedJourneys = computed(() => dashboardConfigStore.config.journeys);
    const stationGroups = computed(
        () => dashboardConfigStore.config.stationGroups
    );
    const currentClock: ComputedRef<CurrentClock> = computed(() => ({
        day: currentDate.value.getDay() as Day,
        minutes:
            currentDate.value.getHours() * 60 + currentDate.value.getMinutes(),
    }));
    const currentMinutes = computed(() => currentClock.value.minutes);
    const activeSchedule = computed(() =>
        getActiveSchedule(schedules.value, currentClock.value)
    );
    const journeysById = computed(
        () =>
            new Map(
                [...ephemeralJourneys.value, ...savedJourneys.value].map(
                    (journey) => [journey.id, journey]
                )
            )
    );
    const savedJourneyIds = computed(
        () => new Set(savedJourneys.value.map((journey) => journey.id))
    );
    const predictedJourneyId = computed(() => {
        const scheduledJourneyId = activeSchedule.value?.journeyId;

        if (scheduledJourneyId && journeysById.value.has(scheduledJourneyId)) {
            return scheduledJourneyId;
        }

        return predictionRecentJourneyIds.find((journeyId) =>
            journeysById.value.has(journeyId)
        );
    });
    const activeJourneyId = computed(() =>
        activeJourney.value.type === "predicted"
            ? predictedJourneyId.value
            : activeJourney.value.id
    );
    const activeJourneyDetails = computed(() =>
        activeJourneyId.value
            ? journeysById.value.get(activeJourneyId.value)
            : undefined
    );
    const activeJourneyIsEphemeral = computed(
        () =>
            activeJourneyId.value !== undefined &&
            !savedJourneyIds.value.has(activeJourneyId.value)
    );
    const journeyChoices = computed<JourneyChoiceGroup[]>(() => {
        const predictedJourney = predictedJourneyId.value
            ? journeysById.value.get(predictedJourneyId.value)
            : undefined;
        const recentJourneys = recentJourneyIds.value
            .filter((journeyId) => journeyId !== predictedJourneyId.value)
            .flatMap((journeyId) => {
                const journey = journeysById.value.get(journeyId);
                return journey ? [journey] : [];
            })
            .slice(0, 3);
        const recentJourneyIdSet = new Set(
            recentJourneys.map((journey) => journey.id)
        );
        const otherSavedJourneys = savedJourneys.value.filter(
            (journey) =>
                journey.id !== predictedJourneyId.value &&
                !recentJourneyIdSet.has(journey.id)
        );

        const groups: JourneyChoiceGroup[] = [
            {
                name: "Predicted",
                journeys: predictedJourney ? [predictedJourney] : [],
            },
            {name: "Recent", journeys: recentJourneys},
            {name: "Saved", journeys: otherSavedJourneys},
        ];

        return groups.filter((group) => group.journeys.length > 0);
    });

    ///// actions /////
    function selectJourney(journeyId: string): boolean {
        if (!journeysById.value.has(journeyId)) {
            return false;
        }

        const selection: ActiveJourney =
            journeyId === predictedJourneyId.value
                ? {type: "predicted"}
                : savedJourneyIds.value.has(journeyId)
                  ? {type: "saved", id: journeyId}
                  : {type: "ephemeral", id: journeyId};

        selectActiveJourney(selection);
        return true;
    }

    function selectEphemeralJourney(fields: JourneyFields): boolean {
        const parsedJourney = createEphemeralJourney(fields);

        if (!parsedJourney) {
            return false;
        }

        const existingJourney = [...journeysById.value.values()].find(
            (journey) => hasSameJourneyFields(journey, parsedJourney)
        );

        if (existingJourney) {
            return selectJourney(existingJourney.id);
        }

        const journey = createEphemeralJourney(
            fields,
            journeysById.value.keys()
        )!;
        ephemeralJourneys.value = [...ephemeralJourneys.value, journey];
        selectActiveJourney({type: "ephemeral", id: journey.id});
        return true;
    }

    function saveActiveJourney(): boolean {
        if (!activeJourneyIsEphemeral.value) {
            return false;
        }

        const ephemeralJourneyId = activeJourneyId.value!;
        const journey = journeysById.value.get(ephemeralJourneyId);

        if (!journey) {
            return false;
        }

        const savedJourney = dashboardConfigStore.saveJourney(journey);

        if (!savedJourney) {
            return false;
        }

        predictionRecentJourneyIds = [
            ...new Set(
                predictionRecentJourneyIds.map((journeyId) =>
                    journeyId === ephemeralJourneyId
                        ? savedJourney.id
                        : journeyId
                )
            ),
        ];
        recentJourneyIds.value = [
            ...new Set(
                recentJourneyIds.value.map((journeyId) =>
                    journeyId === ephemeralJourneyId
                        ? savedJourney.id
                        : journeyId
                )
            ),
        ];
        ephemeralJourneys.value = ephemeralJourneys.value.filter(
            (candidate) => candidate.id !== ephemeralJourneyId
        );
        previousActiveJourneys.length = 0;
        activeJourney.value =
            activeJourney.value.type === "predicted"
                ? {type: "predicted"}
                : {type: "saved", id: savedJourney.id};
        saveMemory();
        return true;
    }

    function clearActiveJourney(): boolean {
        if (activeJourney.value.type !== "ephemeral") {
            return false;
        }

        const previousJourney = previousActiveJourneys.pop() ?? {
            type: "predicted" as const,
        };
        activeJourney.value = normaliseSelection(previousJourney);
        saveMemory();
        return true;
    }

    function selectActiveJourney(selection: ActiveJourney): void {
        if (selection.type === "predicted") {
            previousActiveJourneys.length = 0;
        } else if (
            selection.type === "ephemeral" &&
            selection.id !== activeJourneyId.value
        ) {
            previousActiveJourneys.push(getRestorableActiveJourney());
        } else if (selection.type === "saved") {
            previousActiveJourneys.length = 0;
        }

        activeJourney.value = selection;
        const journeyId = activeJourneyId.value;

        if (journeyId) {
            recentJourneyIds.value = [
                journeyId,
                ...recentJourneyIds.value.filter(
                    (recentJourneyId) => recentJourneyId !== journeyId
                ),
            ].slice(0, 50);
        }

        saveMemory();
    }

    function getRestorableActiveJourney(): ActiveJourney {
        if (activeJourney.value.type !== "predicted") {
            return activeJourney.value;
        }

        const journeyId = activeJourneyId.value;

        if (!journeyId) {
            return {type: "predicted"};
        }

        return savedJourneyIds.value.has(journeyId)
            ? {type: "saved", id: journeyId}
            : {type: "ephemeral", id: journeyId};
    }

    function normaliseSelection(selection: ActiveJourney): ActiveJourney {
        if (selection.type === "predicted") {
            return selection;
        }

        if (!journeysById.value.has(selection.id)) {
            return {type: "predicted"};
        }

        return selection.id === predictedJourneyId.value
            ? {type: "predicted"}
            : selection;
    }

    function saveMemory(): void {
        const retainedEphemeralJourneyIds = new Set([
            ...predictionRecentJourneyIds,
            ...recentJourneyIds.value,
            ...(activeJourney.value.type === "ephemeral"
                ? [activeJourney.value.id]
                : []),
            ...previousActiveJourneys.flatMap((selection) =>
                selection.type === "ephemeral" ? [selection.id] : []
            ),
        ]);
        ephemeralJourneys.value = ephemeralJourneys.value.filter((journey) =>
            retainedEphemeralJourneyIds.has(journey.id)
        );

        const memory: JourneyMemory = {
            recentJourneyIds: recentJourneyIds.value,
            ephemeralJourneys: ephemeralJourneys.value,
        };
        memoryStorage.saveToLocalStorage(memory);
    }

    function updateClock(): void {
        currentDate.value = new Date();
    }

    let previousMinuteParity = currentMinutes.value % 2;
    setInterval(() => {
        const currentMinuteParity = new Date().getMinutes() % 2;

        if (currentMinuteParity !== previousMinuteParity) {
            updateClock();
            previousMinuteParity = currentMinuteParity;
        }
    }, 1000);

    ///// public interface /////
    return {
        schedules,
        savedJourneys,
        stationGroups,
        currentClock,
        currentMinutes,
        activeSchedule,
        predictedJourneyId,
        recentJourneyIds,
        activeJourney,
        activeJourneyId,
        activeJourneyDetails,
        activeJourneyIsEphemeral,
        journeyChoices,
        selectJourney,
        selectEphemeralJourney,
        saveActiveJourney,
        clearActiveJourney,
    };
});

function hasSameJourneyFields(first: Journey, second: Journey): boolean {
    return (
        hasSameLocation(first.origin, second.origin) &&
        hasSameLocation(first.destination, second.destination) &&
        first.viaCrs === second.viaCrs
    );
}

function hasSameLocation(
    first: Journey["origin"],
    second: Journey["origin"]
): boolean {
    return (
        first.type === second.type &&
        first.groupId === second.groupId &&
        (first.type === "group" ||
            (second.type === "station" && first.crs === second.crs))
    );
}
