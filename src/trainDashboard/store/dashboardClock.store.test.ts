import {createPinia, setActivePinia} from "pinia";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {useDashboardClockStore} from "./dashboardClock.store";

describe("useDashboardClockStore", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 7, 24, 9, 17));
        setActivePinia(createPinia());
    });

    afterEach(() => {
        vi.clearAllTimers();
        vi.useRealTimers();
    });

    it("updates the dashboard clock when the minute changes", () => {
        const store = useDashboardClockStore();

        expect(store.currentClock).toEqual({day: 1, minutes: 9 * 60 + 17});

        vi.setSystemTime(new Date(2026, 7, 24, 9, 18));
        vi.advanceTimersByTime(1000);

        expect(store.currentMinutes).toBe(9 * 60 + 18);
    });
});
