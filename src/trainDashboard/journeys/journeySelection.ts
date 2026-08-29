import type {Day, DisplaySchedule, Journey} from "../dto/dashboardConfig.dto";
import {timeToMinutes} from "../dto/dashboardConfig.dto";
import type {
    ActiveJourney,
    JourneyChoiceGroup,
} from "../dto/journeySelection.dto";

export interface CurrentClock {
    day: Day;
    minutes: number;
}

export function getActiveSchedule(
    schedules: DisplaySchedule[],
    currentClock: CurrentClock
): DisplaySchedule | undefined {
    return schedules.find(
        (schedule) =>
            schedule.days.includes(currentClock.day) &&
            currentClock.minutes >= timeToMinutes(schedule.startsAt) &&
            currentClock.minutes < timeToMinutes(schedule.endsAt)
    );
}

export function getJourneysById(
    ephemeralJourneys: Journey[],
    savedJourneys: Journey[]
): Map<string, Journey> {
    return new Map(
        [...ephemeralJourneys, ...savedJourneys].map((journey) => [
            journey.id,
            journey,
        ])
    );
}

export function getPredictedJourneyId(
    activeSchedule: DisplaySchedule | undefined,
    predictionRecentJourneyIds: string[],
    journeysById: Map<string, Journey>
): string | undefined {
    const scheduledJourneyId = activeSchedule?.journeyId;

    if (scheduledJourneyId && journeysById.has(scheduledJourneyId)) {
        return scheduledJourneyId;
    }

    return predictionRecentJourneyIds.find((journeyId) =>
        journeysById.has(journeyId)
    );
}

export function getJourneyChoices(
    savedJourneys: Journey[],
    recentJourneyIds: string[],
    predictedJourneyId: string | undefined,
    journeysById: Map<string, Journey>
): JourneyChoiceGroup[] {
    const predictedJourney = predictedJourneyId
        ? journeysById.get(predictedJourneyId)
        : undefined;
    const recentJourneys = recentJourneyIds
        .filter((journeyId) => journeyId !== predictedJourneyId)
        .flatMap((journeyId) => {
            const journey = journeysById.get(journeyId);
            return journey ? [journey] : [];
        })
        .slice(0, 3);
    const recentJourneyIdSet = new Set(
        recentJourneys.map((journey) => journey.id)
    );
    const otherSavedJourneys = savedJourneys.filter(
        (journey) =>
            journey.id !== predictedJourneyId &&
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
}

export function hasSameJourneyFields(first: Journey, second: Journey): boolean {
    return (
        hasSameLocation(first.origin, second.origin) &&
        hasSameLocation(first.destination, second.destination) &&
        first.viaCrs === second.viaCrs
    );
}

export interface ActiveJourneyState {
    activeJourney: ActiveJourney;
    previousActiveJourneys: ActiveJourney[];
    recentJourneyIds: string[];
}

export function getActiveJourneyUpdate(
    state: ActiveJourneyState,
    selection: ActiveJourney,
    activeJourneyId: string | undefined,
    predictedJourneyId: string | undefined,
    savedJourneyIds: Set<string>
): ActiveJourneyState {
    let previousActiveJourneys = state.previousActiveJourneys;

    if (selection.type === "predicted" || selection.type === "saved") {
        previousActiveJourneys = [];
    } else if (selection.id !== activeJourneyId) {
        previousActiveJourneys = [
            ...previousActiveJourneys,
            getRestorableActiveJourney(
                state.activeJourney,
                activeJourneyId,
                savedJourneyIds
            ),
        ];
    }

    const selectedJourneyId =
        selection.type === "predicted" ? predictedJourneyId : selection.id;
    const recentJourneyIds = selectedJourneyId
        ? [
              selectedJourneyId,
              ...state.recentJourneyIds.filter(
                  (journeyId) => journeyId !== selectedJourneyId
              ),
          ].slice(0, 50)
        : state.recentJourneyIds;

    return {
        activeJourney: selection,
        previousActiveJourneys,
        recentJourneyIds,
    };
}

export function replaceJourneyId(
    journeyIds: string[],
    oldJourneyId: string,
    newJourneyId: string
): string[] {
    return [
        ...new Set(
            journeyIds.map((journeyId) =>
                journeyId === oldJourneyId ? newJourneyId : journeyId
            )
        ),
    ];
}

export function normaliseActiveJourney(
    activeJourney: ActiveJourney,
    predictedJourneyId: string | undefined,
    journeysById: Map<string, Journey>
): ActiveJourney {
    if (activeJourney.type === "predicted") {
        return activeJourney;
    }

    if (!journeysById.has(activeJourney.id)) {
        return {type: "predicted"};
    }

    return activeJourney.id === predictedJourneyId
        ? {type: "predicted"}
        : activeJourney;
}

export function getRetainedEphemeralJourneys<T extends Journey>(
    ephemeralJourneys: T[],
    predictionRecentJourneyIds: string[],
    recentJourneyIds: string[],
    activeJourney: ActiveJourney,
    previousActiveJourneys: ActiveJourney[]
): T[] {
    const retainedJourneyIds = new Set([
        ...predictionRecentJourneyIds,
        ...recentJourneyIds,
        ...(activeJourney.type === "ephemeral" ? [activeJourney.id] : []),
        ...previousActiveJourneys.flatMap((selection) =>
            selection.type === "ephemeral" ? [selection.id] : []
        ),
    ]);

    return ephemeralJourneys.filter((journey) =>
        retainedJourneyIds.has(journey.id)
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

function getRestorableActiveJourney(
    activeJourney: ActiveJourney,
    activeJourneyId: string | undefined,
    savedJourneyIds: Set<string>
): ActiveJourney {
    if (activeJourney.type !== "predicted") {
        return {...activeJourney};
    }

    if (!activeJourneyId) {
        return {type: "predicted"};
    }

    return savedJourneyIds.has(activeJourneyId)
        ? {type: "saved", id: activeJourneyId}
        : {type: "ephemeral", id: activeJourneyId};
}
