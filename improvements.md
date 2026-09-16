# Prioritised feature improvements

Show the useful answer immediately, explain why it applies, and make correction easy.

This document combines the recommendations from Magic Ink, Norman’s interaction design principles, and Shneiderman’s Eight Golden Rules.

The app already uses location and schedule prediction, walking times, live departures, and desktop timelines. These recommendations build on that design.

## Design basis

- **Magic Ink:** show information that helps users compare options, and use context to reduce repeated input. [Magic Ink](https://worrydream.com/MagicInk/)
- **Norman:** make available actions clear and explain how the system works. [Signifiers](https://jnd.org/signifiers-not-affordances/), [conceptual models](https://jnd.org/design-as-communication/)
- **Shneiderman:** support consistency, universal usability, feedback, completion, error prevention, reversal, user control, and reduced memory demands. [Eight Golden Rules](https://www.cs.umd.edu/users/ben/goldenrules.html)

## Priority order

Prioritise clear control and access first, then trustworthy updates, then richer journey decisions. Consider implementation effort and data requirements within that order.

| Priority | Recommendation | Reason for this position |
|---|---|---|
| 1 | Make automatic and manual selection explicit | Users need to understand and control automatic changes. |
| 2 | Distinguish removal actions and add undo | Prevent confusion and make mistakes reversible. |
| 3 | Make controls available across input methods | Core actions must work with keyboard and touch. |
| 4 | Explain disruptions and data freshness | Users need to know when travel advice changes or becomes stale. |
| 5 | Confirm completed actions | Users need clear feedback about saved settings and selections. |
| 6 | Let users follow a particular train | Preserve the chosen service through live updates. |
| 7 | Explain recommendations and the cost of waiting | Help users compare departure and arrival tradeoffs. |
| 8 | Make connection margins explicit | Help users assess transfers and fallback options. |
| 9 | Show live information beside alternative journeys | Reduce repeated selection, with controlled additional requests. |
| 10 | Add arrival deadlines | Support destination-based planning, with additional timetable needs. |

All example times below are illustrative.

## 1. Make automatic and manual selection explicit

The app already explains predictions and preserves manual selections. However, the distinction could be clearer:

> **Automatic · Home → Work**  
> Selected by your weekday schedule.

After choosing another journey:

> **Your choice · Home → Edinburgh**  
> [Return to automatic]

“Return to automatic” explains the result more clearly than the current × labelled “Clear temporary journey”.

This gives users a simple understanding of what changes automatically and what they control.

## 2. Distinguish removal actions and add undo

The switcher currently uses × for three different actions:

- Return to the predicted journey.
- Remove a journey from recent history.
- Delete a saved journey.

Their accessible labels differ, but their visual appearance does not explain those differences.

Use distinct labels or controls, and provide:

> **Saved journey removed.** [Undo]

Keep the existing protection for journeys used by schedules. Explain that dependency beside a disabled removal action.

## 3. Make controls available across input methods

The switcher’s desktop removal controls appear on hover and have `tabindex="-1"`. That deserves a keyboard interaction review.

Actions should be discoverable with touch and keyboard. Essential information should remain understandable without colour or hover.

## 4. Explain disruptions and data freshness

The current parser removes cancelled services. A familiar train can therefore disappear without an explanation.

Keep a compact notice when it affects the journey:

> **08:42 cancelled. Next usable train: 09:03.**

Also show meaningful changes between updates:

> Platform changed from 2 to 4.  
> Your connection now has only 4 minutes between trains.

Show when the data was last updated. If an update fails, retain the previous results with a clear age indicator.

This answers an important question: **“Has something changed that affects my plan?”**

Keep useful results visible during updates. If an update fails, provide a retry action:

> Update failed. Showing data from 08:41. [Retry]

Make cancellations and platform changes apparent without requiring users to remember the previous screen.

## 5. Confirm completed actions

Use small, specific confirmations:

- “Journey saved.”
- “Settings saved.”
- “Using your selected journey.”

Show feedback beside the affected action when practical. Keep routine confirmations brief.

## 6. Let users follow a particular train

Add a **“Follow this train”** action.

Once selected, keep that service visible as time passes or its status changes. Show its current departure, platform, connection, and any cancellation.

This addresses a gap between browsing options and travelling: **once I choose a train, I want updates about that train.**

It also gives automatic updates a clear boundary. The app can suggest a better option while preserving my chosen service.

## 7. Explain recommendations and the cost of waiting

“Leave in 4 minutes” gives an instruction. Add the reason:

> **Earliest arrival · includes your 8-minute walk**

Users can then judge whether the recommendation matches their priorities.

The app says when to leave. It could also explain what happens if you leave later.

For example, using illustrative times:

> **Leave in 4 minutes · arrive 09:12**  
> Leave 15 minutes later and arrive only 6 minutes later.

Useful comparisons include:

- **Earliest arrival**
- **Direct · arrives 4 minutes later**
- **Less walking · arrives 7 minutes later**
- **Next option · arrives 28 minutes later**

This would make the existing results more useful, especially on mobile, where comparing separate itineraries requires more mental calculation.

This can build mainly on the journey data already calculated.

The smallest useful experiment is one comparison sentence below the main departure advice. It would show whether the user needs to hurry.

## 8. Make connection margins explicit

The planner currently uses a fixed three-minute minimum transfer. The display could help users assess the actual tradeoff:

> **4-minute change** · arrive 09:12  
> **12-minute change** · arrive 09:20

Show the next onward train if the connection is missed. Where alternatives exist, explain the benefit of taking an earlier first train:

> Take the earlier train for 10 extra minutes at the connection.

Use measured transfer times. A “reliable connection” label would need stronger evidence.

## 9. Show live information beside alternative journeys

Your switcher already knows relevant alternatives, but their names alone cannot answer whether they are useful now.

For example:

| Journey | Leave | Arrive |
|---|---:|---:|
| Home → Work | In 4 min | 09:12 |
| Home → Edinburgh | In 11 min | 09:48 |

A small visible list could answer the question without selecting each journey. Victor specifically suggests adding departure times to bookmarked trips. [Train case study](https://worrydream.com/MagicInk/#p443)

Limit this to a few relevant alternatives because each requires train-data requests.

## 10. Add arrival deadlines

Let a regular journey express:

> **Arrive at Work by 09:00 on weekdays.**

Then show:

- The latest departure that meets the deadline.
- How much time remains before the deadline.
- The consequence of missing that train.

Your schedules currently control which journey appears. An arrival deadline would add the reason for choosing a particular train.

Future-day planning would require timetable data beyond the current live-board request approach.
