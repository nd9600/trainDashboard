import {watch} from "vue";
import {useGeolocation} from "@vueuse/core";
import type {Coordinates} from "@/trainDashboard/dto/coordinates.dto";

export function useJourneyLocation(
    shouldUseLocation: () => boolean,
    update: (coordinates: Coordinates | null) => void
): void {
    const {coords, locatedAt, error, pause, resume} = useGeolocation({
        immediate: false,
        maximumAge: 60_000,
        enableHighAccuracy: false,
    });
    watch(
        shouldUseLocation,
        (value) => {
            if (value) resume();
            else {
                pause();
                update(null);
            }
        },
        {immediate: true, flush: "sync"}
    );
    watch([coords, error], ([coordinates, geolocationError]) => {
        update(
            shouldUseLocation() && !geolocationError && locatedAt.value !== null
                ? {latitude: coordinates.latitude, longitude: coordinates.longitude}
                : null
        );
    });
}
