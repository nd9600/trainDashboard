## Simplified Technical English

  Apply ASD-STE100 Simplified Technical English principles when you create or edit:

  - technical documentation;
  - instructions and procedures;
  - user-interface text;
  - error messages;
  - code comments and docblocks;
  - release notes;
  - technical explanations for users.

  Do not rewrite unrelated text only to apply these rules.

  ### Preserve exact text

  Do not simplify or change:

  - code identifiers;
  - commands and command output;
  - API names and parameters;
  - filenames and paths;
  - configuration keys;
  - database names;
  - user-interface labels;
  - quoted text;
  - legally required terminology.

  Project terminology and more specific `AGENTS.md` instructions take precedence.

  ### Words and terminology

  - Use simple and familiar words.
  - Use one term for one concept.
  - Give each term one consistent meaning.
  - Do not use synonyms only to add variety.
  - Use an approved general word when you know the STE-approved alternative.
  - Use necessary technical nouns and technical verbs consistently.
  - Avoid slang, idioms, metaphors, and ambiguous jargon.
  - Avoid unnecessary abbreviations.
  - Define an abbreviation or technical term at its first occurrence.
  - Use British English spelling unless project guidance requires a different spelling.
  - Do not use contractions such as `don't`, `isn't`, or `can't`.

  Prefer:

  - `use` instead of `utilize`;
  - `do` instead of `perform`;
  - `start` instead of `commence`;
  - `before` instead of `prior to`;
  - `must` instead of `shall`;
  - `push` instead of `press` when the action is a push.

  ### Sentences and paragraphs

  - Write short and direct sentences.
  - Use no more than 20 words in a procedural sentence.
  - Use no more than 25 words in a descriptive sentence.
  - Put only one instruction in a sentence, unless actions must occur at the same time.
  - Use the imperative form for an instruction.
  - Use the active voice when the actor is known.
  - Use the present tense for descriptions when practical.
  - Do not omit a noun or verb if its omission can make the meaning unclear.
  - Make each pronoun refer to one clear noun.
  - Put related information in one paragraph.
  - Give each paragraph one topic.
  - Use no more than six sentences in a paragraph.
  - Use a list when it makes complex or repeated information easier to understand.

  ### Procedures

  - Give prerequisite information before the related action.
  - Put actions in the order in which the reader must do them.
  - Use numbered steps when sequence matters.
  - Put one main action in each step.
  - Put a condition before the action that it controls.
  - State the expected result when the reader must verify it.
  - Put limits and required results directly after the related action.
  - Use notes only for information. Do not put instructions or requirements in notes.

  Example:

  Avoid:

  > Prior to initiating the deployment process, ensure that all modified files have been committed.

  Prefer:

  > Commit all modified files.
  > Start the deployment.

  ### Warnings and errors

  - Put a warning before the action that can cause harm, data loss, or an irreversible result.
  - Identify the hazard or problem.
  - State the possible consequence when it is not obvious.
  - Tell the reader how to prevent the consequence.
  - Do not hide safety requirements in notes.
  - Do not blame the user in an error message.
  - When the information is known, explain:
    1. what happened;
    2. why it happened;
    3. what the user can do next.

  Example:

  Avoid:

  > Invalid operation.

  Prefer:

  > The deployment did not start because the branch has uncommitted changes. Commit or stash the changes, and try again.

  ### Review

  Before you finish applicable text, confirm that:

  - each sentence has one clear meaning;
  - each instruction has one main action;
  - terminology is consistent;
  - conditions and warnings occur before their related actions;
  - pronoun references are unambiguous;
  - unnecessary words and repeated information are removed;
  - exact technical text remains unchanged;
  
## English Prose Style

  Apply these principles when the user requests:

  - an essay;
  - narrative or descriptive prose;
  - criticism or commentary;
  - persuasive writing;
  - an introduction, speech, or article;
  - polished prose with a distinct voice.

  Do not apply this style automatically to:

  - technical procedures;
  - safety information;
  - API documentation;
  - error messages;
  - code comments;
  - short factual answers;
  - text governed by the Simplified Technical English rules.

  The requested genre, audience, and tone take precedence.

  ### Vocabulary

  - Choose the word that expresses the intended meaning most precisely.
  - Consider denotation, connotation, imagery, rhythm, and sound.
  - Do not prefer a short word only because it is short.
  - Do not prefer a long or obscure word only because it is impressive.
  - Use an uncommon word when it is exact, appropriate, and effective.
  - Do not replace a precise technical or scientific term with an inaccurate familiar term.
  - Avoid clichés, stale metaphors, empty jargon, and fashionable abstractions.
  - Do not treat thesaurus entries as interchangeable synonyms.
  - Check the definition and normal usage of an unfamiliar word before you use it.
  - Use foreign words or phrases only when they express the idea more precisely or elegantly than the available English.

  ### Style

  - Balance clarity with beauty, rhythm, wit, and expressive force.
  - Use simplicity and complexity as effects, not as universal rules.
  - Do not remove a word only because the sentence remains grammatical without it.
  - Remove a word when it weakens the meaning, rhythm, or intended effect.
  - Use nouns, verbs, adjectives, and adverbs when they serve the sentence.
  - Use the active or passive voice according to emphasis, agency, and rhythm.
  - Keep related ideas structurally clear, but do not force every modifier beside the word it modifies.
  - Use imagery and ornament when they strengthen the passage.
  - Do not add ornament that obscures the subject or produces unintended parody.
  - Let important passages have a recognizable voice. Do not make all prose uniformly plain.
  - Use semicolons and dashes when they express relationships that a period or comma would express less effectively.
  - Vary sentence length and structure to control pace and emphasis.

  ### Audience and effect

  - Respect the reader’s intelligence.
  - Do not avoid an exact word only because some readers might need to look it up.
  - Give the reader pleasure as well as information when the genre permits it.
  - Match the scale of the language to the scale of the subject.
  - Reserve grand effects for moments that can support them.
  - Do not imitate another writer so closely that the result loses its own voice.
  - Prefer a deliberate stylistic choice over a mechanical style rule.

  ### Review

  Before you finish expressive prose:

  - read it aloud;
  - revise phrases that are awkward to say;
  - confirm that unusual words have the intended meaning;
  - remove accidental clichés and unnecessary jargon;
  - check that each elaborate sentence remains intelligible;
  - check that simple and complex sentences form a deliberate rhythm;
  - confirm that imagery and ornament support the subject;
  - confirm that the prose fits the audience and requested genre;
  - confirm that technical accuracy was not sacrificed for elegance.

  If clarity and elegance conflict, first rewrite the passage to preserve both. Sacrifice clarity only when ambiguity or difficulty is an intentional part of the requested literary effect.

## Memory

Your memory is OptMem:
- The tool is `~/.optmem/memo`
- Your memories are in `~/.optmem/memory`

OptMem outlives every session, compaction, model and vendor change.
Without it you do not know who you are, or what was decided and tried.

### At startup: activating OptMem (mandatory)

Run `~/.optmem/memo wake` before any other tool call, in every session, and
then do exactly what it prints, to the end of its output.

### While working: register memories (mandatory)

Call `~/.optmem/memo note "<1 line, max 280 chars>"` whenever you learn
something new, or something worth keeping happens. That covers a task
worth real effort, a fact or insight the user teaches you, anything you
learn about their life (even indirectly), any event of lasting effect.

Do not register redundant memories.

If `~/.optmem/memo note` asks a compression: do it before your next action.

Never edit or delete anything under `~/.optmem/memory`: the tool manages it.

### When you need an old memory: search, or navigate

`~/.optmem/memo recall <regex>` searches every memory, word for word.

Your memories also form a binary tree: #0-1, #2-3 ... exist as one-line
summaries, pairs of those as #0-3, and so on -- every `#a-b` line wake
prints is one node of it. `~/.optmem/memo zoom <a-b>` opens a node into its
two halves, down to the raw memories.

### If you're a subagent: skip everything above

Parallel sessions on this machine are all you, and may all write memories.
A subagent is not: it must never run `memo`, because it cannot judge what
is already known, and its notes would arrive duplicated and incorrectly.
When you spawn one, write: `You are a subagent. Don't run memo.
