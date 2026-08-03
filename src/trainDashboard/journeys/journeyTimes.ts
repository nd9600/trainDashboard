import type {TimetabledJourney} from "../dto/timetabledJourney.dto";

export function getMustLeaveMessage(
    journey: TimetabledJourney,
    currentMinutes: number
): string {
    const minutes = journey.segments.at(0)!.start - currentMinutes;

    if (minutes <= 1) {
        return "must leave now";
    }

    return `must leave in ${minutes} minutes`;
}

export function getJourneyTimelineRange(
    journeys: TimetabledJourney[],
    currentMinutes: number
): {start: number; end: number} {
    const segments = journeys.flatMap((journey) => journey.segments);

    return {
        start:
            Math.min(
                currentMinutes,
                ...segments.map((segment) => segment.start)
            ) - 5,
        end:
            Math.max(
                currentMinutes,
                ...segments.map((segment) => segment.end)
            ) + 10,
    };
}
