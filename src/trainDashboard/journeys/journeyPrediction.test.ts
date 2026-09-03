import {describe, expect, it} from "vitest";
import {manchesterDashboardConfig} from "../testing/manchesterDashboardConfig.fixture";
import {getJourneyPrediction} from "./journeyPrediction";

describe("getJourneyPrediction", () => {
    it.each([
        {day: 1, minutes: 8 * 60, scheduleId: "weekday-morning"},
        {day: 3, minutes: 12 * 60, scheduleId: "weekday-afternoon"},
        {day: 6, minutes: 14 * 60, scheduleId: "weekend"},
    ] as const)(
        "uses $scheduleId at its configured day and time",
        ({day, minutes, scheduleId}) => {
            const prediction = getJourneyPrediction(
                manchesterDashboardConfig.schedules,
                {day, minutes}
            );

            expect(prediction.activeSchedule?.id).toBe(scheduleId);
            expect(prediction.predictedJourneyId).toBe(
                prediction.activeSchedule?.journeyId
            );
        }
    );
});
