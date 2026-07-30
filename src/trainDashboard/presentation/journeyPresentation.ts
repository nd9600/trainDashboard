import type {Journey} from "../dto/journey.dto";

// Keep journey wording consistent between mobile and desktop views.
export function mustLeaveText(journey: Journey, now: number): string {
    const minutes = journey.segments.at(0)!.start - now;

    if (minutes <= 0) {
        return "must leave now";
    }

    return `must leave in ${minutes} minute${minutes === 1 ? "" : "s"}`;
}
