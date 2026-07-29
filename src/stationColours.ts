const stationColours = [
    "#176269",
    "#65558f",
    "#a85f2d",
    "#315f8c",
    "#4f713f",
    "#9b3d4f",
] as const;

export function stationColour(crs: string): string {
    const hash = [...crs].reduce(
        (total, character) => total + character.charCodeAt(0),
        0
    );

    return stationColours[hash % stationColours.length]!;
}
