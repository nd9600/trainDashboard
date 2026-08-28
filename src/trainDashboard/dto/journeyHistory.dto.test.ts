import {describe, expect, it} from "vitest";
import {journeyHistorySchema} from "./journeyHistory.dto";

describe("journeyHistorySchema", () => {
    it("loads saved journey history from before entry types were added", () => {
        const history = journeyHistorySchema.parse([
            {
                journeyId: "heaton-chapel-to-liverpool",
                selectedAt: "2026-08-27T08:00:00.000Z",
            },
        ]);

        expect(history).toEqual([
            {
                type: "saved",
                journeyId: "heaton-chapel-to-liverpool",
                selectedAt: "2026-08-27T08:00:00.000Z",
            },
        ]);
    });
});
