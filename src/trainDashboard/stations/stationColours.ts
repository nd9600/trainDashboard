// A CRS code always receives the same colour throughout the dashboard.
const stationColours = [
    "var(--color-station-teal)",
    "var(--color-station-terracotta)",
    "var(--color-station-ochre)",
    "var(--color-station-plum)",
    "var(--color-station-orange)",
    "var(--color-station-olive)",
] as const;

export function stationColour(crs: string): string {
    const hash = [...crs].reduce(
        (total, character) => total + character.charCodeAt(0),
        0
    );

    return stationColours[hash % stationColours.length]!;
}
