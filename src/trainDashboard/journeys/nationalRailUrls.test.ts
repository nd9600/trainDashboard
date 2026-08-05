import {describe, expect, it} from "vitest";
import {getNationalRailJourneyUrl} from "./nationalRailUrls";

describe("getNationalRailJourneyUrl", () => {
    it("links a journey from the requested departure time", () => {
        expect(getNationalRailJourneyUrl("ANL", "EDB", 17 * 60)).toBe(
            "https://ojp.nationalrail.co.uk/service/timesandfares/ANL/EDB/today/1700/dep"
        );
    });

    it("links an after-midnight journey on the next day", () => {
        expect(getNationalRailJourneyUrl("ANL", "EDB", 24 * 60 + 10)).toBe(
            "https://ojp.nationalrail.co.uk/service/timesandfares/ANL/EDB/tomorrow/0010/dep"
        );
    });
});
