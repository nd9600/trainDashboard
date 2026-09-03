import type {TimetabledJourney} from "../../dto/timetabledJourney.dto";
import type {RouteTimetable} from "./loadRouteTimetables";
import {makeTimetabledJourney} from "./makeTimetabledJourney";
import {getTrainPlans} from "./trainPlans";

export function planTimetabledJourneys(
    routeTimetables: RouteTimetable[],
    currentMinutes: number
): TimetabledJourney[] {
    const journeys = routeTimetables
        .flatMap((routeTimetable) =>
            getTrainPlans(routeTimetable, currentMinutes)
        )
        .map(makeTimetabledJourney)
        .filter((journey) => journey.segments.at(0)!.start >= currentMinutes)
        .sort(compareJourneysByFinishTime);
    const recommendedJourney = journeys.find(
        (journey) => journey.walkingTimesKnown
    );

    return journeys.map((journey) => ({
        ...journey,
        recommended: journey === recommendedJourney,
    }));
}

function compareJourneysByFinishTime(
    first: TimetabledJourney,
    second: TimetabledJourney
): number {
    const arrivalDifference =
        first.segments.at(-1)!.end - second.segments.at(-1)!.end;

    return (
        arrivalDifference ||
        second.segments.at(0)!.start - first.segments.at(0)!.start
    );
}
