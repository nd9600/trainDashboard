import {defineStore} from "pinia";
import {computed, onScopeDispose, ref, type ComputedRef} from "vue";
import type {Day} from "../dto/dashboardConfig.dto";
import type {CurrentClock} from "../journeys/journeySelection";

export const useDashboardClockStore = defineStore("dashboard-clock", () => {
    const currentDate = ref(new Date());

    const currentClock: ComputedRef<CurrentClock> = computed(() => ({
        day: currentDate.value.getDay() as Day,
        minutes:
            currentDate.value.getHours() * 60 + currentDate.value.getMinutes(),
    }));
    const currentMinutes = computed(() => currentClock.value.minutes);

    let previousMinuteParity = currentMinutes.value % 2;
    const timer = setInterval(() => {
        const currentMinuteParity = new Date().getMinutes() % 2;

        if (currentMinuteParity !== previousMinuteParity) {
            currentDate.value = new Date();
            previousMinuteParity = currentMinuteParity;
        }
    }, 1000);

    onScopeDispose(() => clearInterval(timer));

    return {currentClock, currentMinutes};
});
