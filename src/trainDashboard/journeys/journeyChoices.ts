import type {Journey} from "../dto/journey.dto";
import type {JourneyChoices} from "../dto/journeySelection.dto";
import type {JourneyPrediction} from "./journeyPrediction";

export function getJourneyChoices(
    journeys: Map<string, Journey>,
    prediction: JourneyPrediction,
    recentIds: string[],
    saved: Journey[]
): JourneyChoices[] {
    const seen = new Set<string>();
    function take(ids: (string | undefined)[], limit = Infinity): Journey[] {
        const choices: Journey[] = [];
        for (const id of ids) {
            const journey = id ? journeys.get(id) : undefined;
            if (!journey || seen.has(journey.id)) continue;
            seen.add(journey.id);
            choices.push(journey);
            if (choices.length === limit) break;
        }
        return choices;
    }
    const groups: JourneyChoices[] = [
        {name: "Predicted", journeys: take([prediction.predictedJourneyId])},
        {name: "Alternatives", journeys: take(prediction.alternativeJourneyIds)},
        {name: "Recent", journeys: take(recentIds, 3)},
        {name: "Saved", journeys: take(saved.map((journey) => journey.id))},
    ];
    return groups.filter((group) => group.journeys.length);
}
