import type {TimetabledJourney} from "../dto/timetabledJourney.dto";

export function getMustLeaveMessage(journey: TimetabledJourney, currentMinutes: number): string {
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
        start: Math.min(currentMinutes, ...segments.map((segment) => segment.start)) - 5,
        end: Math.max(currentMinutes, ...segments.map((segment) => segment.end)) + 10,
    };
}

// Use whole-minute intervals that remain useful when a journey crosses midnight.
export function getTimelineTicks(start: number, end: number): number[] {
    const minimumStep = (end - start) / 8;
    const step =
        [1, 2, 5, 10, 15, 30, 60, 120, 180, 360, 720, 1440].find((step) => step >= minimumStep) ??
        Math.ceil(minimumStep / 1440) * 1440;
    const ticks: number[] = [];
    for (let tick = Math.ceil(start / step) * step; tick <= end; tick += step) ticks.push(tick);
    return ticks;
}
