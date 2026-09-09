interface Coordinates {
    latitude: number;
    longitude: number;
}

function toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
}

export function distanceBetweenCoordinatesKm(
    from: Coordinates,
    to: Coordinates
): number {
    const latitude1 = toRadians(from.latitude);
    const latitude2 = toRadians(to.latitude);
    const latitudeDifference = toRadians(to.latitude - from.latitude);
    const longitudeDifference = toRadians(to.longitude - from.longitude);

    // Use the Haversine formula for distance on a sphere.
    const score =
        Math.sin(latitudeDifference / 2) ** 2 +
        Math.cos(latitude1) *
            Math.cos(latitude2) *
            Math.sin(longitudeDifference / 2) ** 2;
    const earthRadiusKm = 6371;
    return (
        2 *
        earthRadiusKm *
        Math.asin(Math.sqrt(Math.min(1, Math.max(0, score))))
    );
}

export function findClosestPoint<T extends Coordinates>(
    currentPosition: Coordinates,
    points: readonly T[]
): T | undefined {
    if (points.length === 0) {
        return undefined;
    }

    return points.reduce((closest, point) =>
        distanceBetweenCoordinatesKm(currentPosition, point) <
        distanceBetweenCoordinatesKm(currentPosition, closest)
            ? point
            : closest
    );
}
