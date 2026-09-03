import {createPinia, setActivePinia} from "pinia";
import {beforeEach, describe, expect, it, vi} from "vitest";
import {MemoryStorage} from "../../testing/MemoryStorage";
import {manchesterDashboardConfig} from "../testing/manchesterDashboardConfig.fixture";
import {useDashboardConfigStore} from "./dashboardConfig.store";

describe("useDashboardConfigStore", () => {
    beforeEach(() => {
        vi.stubGlobal("localStorage", new MemoryStorage());
        setActivePinia(createPinia());
    });

    it("saves an ephemeral station pair once", () => {
        const store = useDashboardConfigStore();
        store.saveConfig(manchesterDashboardConfig);

        const journey = {
            id: "man-to-liv",
            origin: {type: "station" as const, crs: "MAN"},
            destination: {type: "station" as const, crs: "LIV"},
            viaCrs: "CRE",
        };
        const firstResult = store.saveJourney(journey);
        const secondResult = store.saveJourney(journey);

        expect(firstResult).toEqual({
            id: "man-to-liv",
            origin: {type: "station", crs: "MAN"},
            destination: {type: "station", crs: "LIV"},
            viaCrs: "CRE",
        });
        expect(secondResult).toEqual(firstResult);
        expect(
            store.config.journeys.filter(
                (journey) => journey.id === "man-to-liv"
            )
        ).toHaveLength(1);
    });
});
