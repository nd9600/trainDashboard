export function getNationalRailJourneyUrl(
    originCrs: string,
    destinationCrs: string,
    departureMinutes: number
): string {
    return `https://ojp.nationalrail.co.uk/service/timesandfares/${encodeURIComponent(originCrs)}/${encodeURIComponent(destinationCrs)}/today/${formatNationalRailDepartureTime(departureMinutes)}/dep`;
}

function formatNationalRailDepartureTime(minutes: number): string {
    const normalisedMinutes = ((minutes % 1440) + 1440) % 1440;
    const hours = Math.floor(normalisedMinutes / 60);
    const remainingMinutes = normalisedMinutes % 60;

    return `${hours.toString().padStart(2, "0")}${remainingMinutes
        .toString()
        .padStart(2, "0")}`;
}
