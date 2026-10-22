import type {Journey} from "../dto/journey.dto";
import type {JourneyChoices} from "../dto/journeySelection.dto";
import type {JourneyPrediction} from "./journeyPrediction";

export function getJourneyChoices(
    journeysById: Map<string, Journey>,
    prediction: JourneyPrediction,
    recentJourneyIds: string[],
    savedJourneys: Journey[]
): JourneyChoices[] {
    const alreadyListedJourneyIds = new Set<string>();
    function takeUnlistedJourneys(journeyIds: (string | undefined)[], limit = Infinity): Journey[] {
        const choices: Journey[] = [];
        for (const id of journeyIds) {
            const journey = id
                ? journeysById.get(id)
                : undefined;
            if (!journey || alreadyListedJourneyIds.has(journey.id)) {
                continue
            }

            alreadyListedJourneyIds.add(journey.id);
            choices.push(journey);
            if (choices.length === limit) {
                break
            }
        }
        return choices;
    }
    const groups: JourneyChoices[] = [
        {name: "Predicted", journeys: takeUnlistedJourneys([prediction.predictedJourneyId])},
        {name: "Alternatives", journeys: takeUnlistedJourneys(prediction.alternativeJourneyIds)},
        {name: "Recent", journeys: takeUnlistedJourneys(recentJourneyIds, 3)},
        {name: "Saved", journeys: takeUnlistedJourneys(savedJourneys.map((journey) => journey.id))},
    ];
    return groups.filter((group) => group.journeys.length > 0);
}
