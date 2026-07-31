import type {TimetabledJourney} from "../dto/timetabledJourney.dto";

// Keep journey wording consistent between mobile and desktop views.
export function mustLeaveText(
    journey: TimetabledJourney,
    currentMinutes: number
): string {
    const minutes = journey.segments.at(0)!.start - currentMinutes;

    if (minutes <= 1) {
        return "must leave now";
    }

    return `must leave in ${minutes} minutes`;
}

export function journeyTimelineRange(
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

export function nationalRailJourneyUrl(journey: TimetabledJourney): string {
    const departure = journey.segments.find(
        (segment) => segment.kind === "train"
    )!.start;

    return nationalRailUrl(journey.origin, journey.destination, departure);
}

export function nationalRailUrl(
    originCrs: string,
    destinationCrs: string,
    departureMinutes: number
): string {
    return `https://ojp.nationalrail.co.uk/service/timesandfares/${encodeURIComponent(originCrs)}/${encodeURIComponent(destinationCrs)}/today/${formatNationalRailTime(departureMinutes)}/dep`;
}

function formatNationalRailTime(minutes: number): string {
    const normalisedMinutes = ((minutes % 1440) + 1440) % 1440;
    const hours = Math.floor(normalisedMinutes / 60);
    const remainingMinutes = normalisedMinutes % 60;

    return `${hours.toString().padStart(2, "0")}${remainingMinutes
        .toString()
        .padStart(2, "0")}`;
}
