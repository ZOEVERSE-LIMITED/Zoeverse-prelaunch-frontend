/* =========================================================================
   THE ROUTING ENGINE
   =========================================================================
   Everything an earlier answer changes about the screens after it happens here,
   and only here. No component branches on an answer; components render what
   these functions hand them.

   PURE. No React, no DOM, no clock, no storage, no network. The same config plus
   the same answers always produces the same screens, which is what makes the
   routing testable without rendering anything.

   Three transforms, applied in this order to every question:

     1. VISIBILITY  — `showWhen`. A question that does not apply is REMOVED,
                      never disabled or hidden. A hidden question is one CSS
                      change away from being asked, and a disabled one still
                      tells somebody it exists.
     2. VARIANT     — `variantBy`. Swaps wording or a ladder based on an
                      earlier answer.
     3. REFERENT    — token substitution, so "you" becomes "they" when the
                      visit was for somebody else.

   Order matters: a variant supplies new strings, and those strings need the
   referent applied too. Doing referent first would leave `{{subject}}` sitting
   unresolved in any variant text.
   ========================================================================= */

/* --------------------------------------------------------------- matching */

/** Every question the config declares, visible or not, by id. */
function questionById(config, id) {
  for (const screen of config.screens) {
    for (const question of screen.questions) {
      if (question.id === id) return question;
    }
  }
  return undefined;
}

/**
 * The value of the option carrying a flag, on the question this condition
 * points at. Undefined when the question, the flag or the option list is
 * missing.
 */
function flaggedOptionValue(config, questionId, flag) {
  const question = questionById(config, questionId);
  if (!question) return undefined;
  if (question.kind !== "single_choice" && question.kind !== "multi_choice") {
    return undefined;
  }
  return question.options.find((option) => option[flag])?.value;
}

export function matches(condition, answers, config) {
  const actual = answers[condition.questionId];

  /*
    MATCH ON A SERVER-SET FLAG, NOT A HARDCODED CODE. The HMO list belongs to
    the server, so "my HMO is not listed" can be `OTHER` today and `NOT_LISTED`
    tomorrow. A condition written against the literal would stop firing on that
    rename, nothing would error, and the follow-up would silently stop being
    asked.

    An option list the server has not filled in yet resolves to undefined, and
    the question stays HIDDEN — showing "what is the name of your HMO?" before
    the list has loaded asks somebody to answer a follow-up to a question they
    have not been asked.
  */
  if (condition.equalsOptionFlagged) {
    const flagged = flaggedOptionValue(
      config,
      condition.questionId,
      condition.equalsOptionFlagged,
    );
    return flagged !== undefined && actual === flagged;
  }

  /*
    "Answered, and not one of these." REQUIRING AN ANSWER IS PART OF THE
    PREDICATE. Treating unanswered as a match would show "what did you pay for?"
    above the still-unanswered "what did you pay?", which reads as the form
    asking the same thing twice.
  */
  if (condition.notEquals) {
    if (actual === undefined || actual === null || actual === "") return false;
    return !condition.notEquals.some((option) => option === actual);
  }

  // `equals` as an array means "any of these" — several answers can open the
  // same question (HMO, NHIA and employer all mean somebody else is paying).
  const expected = condition.equals;
  if (Array.isArray(expected)) {
    return expected.some((option) => option === actual);
  }
  return actual === expected;
}

/* -------------------------------------------------------------- referents */

/** Which pronoun set applies, given the answers so far. */
export function referentSet(config, answers) {
  const rule = config.referent;
  if (!rule) return {};

  const answer = answers[rule.by];
  const key =
    (typeof answer === "string" ? rule.map[answer] : undefined) ?? rule.defaultSet;

  // An unrecognised set key falls back rather than throwing. A config typo
  // must not white-screen somebody halfway through a review.
  return rule.sets[key] ?? rule.sets[rule.defaultSet] ?? {};
}

/**
 * Replace `{{token}}` with its value.
 *
 * An UNKNOWN token is left exactly as written, deliberately. Substituting an
 * empty string would silently produce "How was experience?" and read as a copy
 * mistake nobody can trace; leaving `{{possessiv}}` on screen is ugly and
 * immediately obvious in review, which is the failure mode you want.
 */
export function applyTokens(text, tokens) {
  return text.replace(/\{\{(\w+)\}\}/g, (whole, token) =>
    Object.prototype.hasOwnProperty.call(tokens, token) ? tokens[token] : whole,
  );
}

/* ---------------------------------------------------------------- variants */

/** Which variant an earlier answer selects, if any. */
function chooseVariant(rule, answers) {
  if (!rule) return undefined;
  const answer = answers[rule.by];
  const key = typeof answer === "string" ? rule.map[answer] : undefined;
  return key ? rule.variants[key] : undefined;
}

/**
 * Merge in the selected variant.
 *
 * The merge is shallow, so a variant supplying only `question` keeps the base
 * options, and one supplying only `options` keeps the base wording.
 *
 * `variantBy` is DROPPED from the result WHETHER OR NOT A VARIANT MATCHED.
 * Stripping it only on the matching path leaves every unused alternative
 * attached to the question, carrying its own raw `{{token}}` text — which then
 * shows up in anything that serialises a question. It is also simply wrong:
 * what leaves this layer is resolved, and a resolved question has no
 * alternatives left to choose between.
 */
function applyVariant(question, answers) {
  if (question.kind !== "rating_scale" && question.kind !== "single_choice") {
    return question;
  }
  if (!question.variantBy) return question;

  const next = { ...question, ...(chooseVariant(question.variantBy, answers) ?? {}) };
  delete next.variantBy;
  return next;
}

/* ---------------------------------------------------------------- resolve */

/** Apply the referent to every string a person will actually read. */
function applyReferent(question, tokens) {
  const resolved = {
    ...question,
    question: applyTokens(question.question, tokens),
    prompt: question.prompt ? applyTokens(question.prompt, tokens) : undefined,
  };

  if (resolved.kind === "rating_scale") {
    return {
      ...resolved,
      options: resolved.options.map((option) => ({
        ...option,
        label: applyTokens(option.label, tokens),
      })),
    };
  }

  if (resolved.kind === "single_choice" || resolved.kind === "multi_choice") {
    return {
      ...resolved,
      options: resolved.options.map((option) => ({
        ...option,
        label: applyTokens(option.label, tokens),
        description: option.description
          ? applyTokens(option.description, tokens)
          : undefined,
      })),
    };
  }

  return resolved;
}

/**
 * The questions on a screen that actually apply, fully resolved and ready to
 * render. A component should never see a raw config question.
 */
export function resolveScreen(screen, config, answers) {
  const tokens = referentSet(config, answers);

  return {
    ...screen,
    title: applyTokens(screen.title, tokens),
    subtitle: screen.subtitle ? applyTokens(screen.subtitle, tokens) : undefined,
    questions: screen.questions
      .filter(
        (question) => !question.showWhen || matches(question.showWhen, answers, config),
      )
      .map((question) => applyReferent(applyVariant(question, answers), tokens)),
  };
}

/**
 * The screens that actually apply, in order.
 *
 * EVERYTHING THAT COUNTS SCREENS MUST COUNT THESE. Using `config.screens`
 * directly means the progress indicator promises a step that will never be
 * shown — "Step 2 of 6" followed by a jump to 3 of 6 with nothing in between.
 */
export function visibleScreens(config, answers) {
  return config.screens.filter((screen) => {
    if (screen.showWhen && !matches(screen.showWhen, answers, config)) return false;

    /*
      A SCREEN WHOSE EVERY QUESTION HAS BEEN WITHDRAWN IS NOT A SCREEN. Left in,
      it renders a heading, a Continue button and nothing to answer — which reads
      as a page that failed to load, and which the step counter would still
      promise as a step.

      `ownRoute` screens are exempt: verification and consent legitimately hold
      no questions, because a phone number and a consent tick are not answers.
    */
    if (screen.ownRoute) return true;
    return screen.questions.some(
      (question) => !question.showWhen || matches(question.showWhen, answers, config),
    );
  });
}

/**
 * The consent items that actually apply.
 *
 * A HIDDEN CONSENT IS NOT RECORDED AT ALL — it is absent from the grants rather
 * than stored as `granted: false`, because recording a refusal of something
 * never shown is a false statement about what somebody was asked.
 */
export function visibleConsentItems(items, answers, config) {
  return items.filter((item) => !item.showWhen || matches(item.showWhen, answers, config));
}

/**
 * Turn what somebody ticked into the record that gets stored.
 *
 * ---------------------------------------------------------------------------
 * THE REQUIRED ITEMS SHARE ONE TICK. THE RECORD DOES NOT.
 * ---------------------------------------------------------------------------
 * Mandatory statements presented as separate checkboxes offer no choice: there
 * is no combination other than all-or-nothing, so the extra taps are friction on
 * a decision that was already binary. They are agreed to in one action.
 *
 * WHAT DOES NOT COLLAPSE is the evidence. Every statement is still recorded
 * individually, with its own full wording verbatim, because "what did this
 * person agree to" has to be answerable years later, statement by statement.
 * How many taps it took is a fact about the screen; what was agreed to is a fact
 * about the person.
 *
 * THE THREE CONDITIONS THIS RELIES ON, none of which may be quietly dropped:
 *   1. Every statement is VISIBLE before the tick — not behind a link. Bundling
 *      the action is fine; hiding the substance is not. "Informed" is a separate
 *      requirement from "specific", and only the second one is being merged.
 *   2. Nothing starts ticked, so it is still one deliberate affirmative act.
 *   3. OPTIONAL ITEMS ARE NEVER IN THE BUNDLE. They are not necessary for the
 *      service, so refusing them must still leave a working review — which is
 *      the exact distinction the anti-bundling rule protects, and the reason
 *      merging the mandatory ones does not offend it.
 *
 * @param {Array} items  VISIBLE items only. One that did not apply was never asked.
 * @param {{ requiredAccepted: boolean, optional: Record<string, boolean> }} decisions
 */
export function buildConsentRecord(items, decisions, noticeVersion, grantedAt) {
  return {
    noticeVersion,
    grantedAt,
    grants: items.map((item) => ({
      id: item.id,
      granted: item.required
        ? decisions.requiredAccepted
        : !!decisions.optional[item.id],
      required: item.required,
      // The FULL wording, verbatim — never the one-line summary they read. A
      // refusal carries its wording too: what somebody declined is evidence.
      text: item.text,
    })),
  };
}

/**
 * How many SCORED dimensions carry a real 1–5 answer.
 *
 * "NA" is excluded, which is the entire point: a review of seven opt-outs is a
 * complete, honest review and a useless basis for scoring. Counting it against
 * `minScoredAnswers` is what lets the backend keep the first fact and act on the
 * second.
 *
 * Counts VISIBLE questions only. A scored dimension withdrawn by an earlier
 * answer was never asked, so it cannot be held against the person for being
 * unanswered.
 */
export function countScoredAnswered(config, answers) {
  let count = 0;
  for (const screen of visibleScreens(config, answers)) {
    for (const question of resolveScreen(screen, config, answers).questions) {
      if (!question.scored) continue;
      if (typeof answers[question.id] === "number") count += 1;
    }
  }
  return count;
}

/**
 * A starter stem that was never finished is not an answer.
 *
 * Tapping "If you go, know that…" and then Continue would otherwise submit that
 * phrase as somebody's review — words we wrote, attributed to them, on a public
 * page. This returns null for anything that is only a stem, so the answer records
 * as "skipped" rather than as our own prompt read back.
 *
 * The comparison strips the trailing ellipsis and punctuation, because somebody
 * who tapped a chip and then deleted the "…" has still written nothing. A stem
 * with real words after it is kept in full, exactly as typed.
 */
export function meaningfulText(value, starters) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed === "") return null;
  if (!starters || starters.length === 0) return trimmed;

  const bare = (text) => text.replace(/[\s.…]+$/, "").trim().toLowerCase();
  const stripped = bare(trimmed);

  // Exactly a stem, or a stem plus nothing but punctuation and spaces.
  return starters.some((starter) => bare(starter) === stripped) ? null : trimmed;
}

/* -------------------------------------------------------------- answering */

/** Has this question been answered? Distinguishes "not answered" from `false`. */
export function isAnswered(question, answers) {
  const value = answers[question.id];
  if (value === undefined || value === null) return false;
  // `false` is a real answer to a yes/no question, and 0 is never a valid
  // rating, so only emptiness and absence count as unanswered.
  if (typeof value === "string") return value.trim() !== "";
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

/**
 * Required questions on this screen that are not answered yet, keyed by question
 * id so each message lands under its own question.
 *
 * Only ever looks at questions that are actually VISIBLE — requiring an answer
 * to a question nobody was shown blocks somebody on something they cannot see,
 * which is the single most common way a conditional form traps people.
 */
export function screenErrors(screen, config, answers) {
  const resolved = resolveScreen(screen, config, answers);
  const errors = {};

  for (const question of resolved.questions) {
    if (!question.required || isAnswered(question, answers)) continue;
    errors[question.id] =
      question.kind === "text" ? "Please fill this in." : "Please choose one.";
  }

  // A minimum length is a real requirement, not a suggestion, so it is checked
  // here rather than left to the server to bounce after somebody has finished.
  for (const question of resolved.questions) {
    if (question.kind !== "text" || !question.minLength) continue;
    const value = answers[question.id];
    if (
      typeof value === "string" &&
      value.trim() !== "" &&
      value.trim().length < question.minLength
    ) {
      errors[question.id] =
        `A little more, please — at least ${question.minLength} characters.`;
    }
  }

  return errors;
}

/** Every question id the config knows about, visible or not. */
function knownIds(config) {
  const known = new Set();
  for (const screen of config.screens) {
    for (const question of screen.questions) known.add(question.id);
  }
  return known;
}

/**
 * Is this stored answer still one the question actually offers?
 *
 * A VARIANT CAN REPLACE AN OPTION SET UNDER AN ANSWER THAT WAS ALREADY GIVEN.
 * Somebody selects "Delivery", picks the "over ₦1,000,000" cost band, then goes
 * back and changes the visit to an outpatient consultation. The cost question is
 * still on screen, so it is not orphaned — but it is now showing a completely
 * different ladder, and the stored code belongs to the one it replaced. Left
 * alone, that submits a million-naira band against a consultation.
 *
 * Scored dimensions are unaffected by design: every variant of a ladder keeps
 * the same 1–5 values, so nothing there can fall out of range.
 */
function answerIsOffered(question, value) {
  if (value === undefined || value === null) return true;

  switch (question.kind) {
    case "rating_scale":
      if (value === "NA") return !!question.allowNotApplicable;
      return question.options.some((option) => option.value === value);

    case "single_choice":
      // A list the server has not filled in yet cannot judge its own answer.
      // Deleting on that basis would wipe a valid answer during a slow load.
      if (question.options.length === 0) return true;
      return question.options.some((option) => option.value === value);

    case "multi_choice":
      if (!Array.isArray(value)) return false;
      return value.every((entry) =>
        question.options.some((option) => option.value === entry),
      );

    case "boolean":
      return value === true || value === false;

    default:
      // Free text and the facility confirmation have no option set to fall out of.
      return true;
  }
}

/** One pass: answers that are no longer asked, or no longer offered. */
function orphansOnce(config, answers, known) {
  const visible = new Map();
  // Screens can be dropped too, so start from the visible ones — an answer on a
  // screen nobody sees is as retracted as one on a hidden question.
  for (const screen of visibleScreens(config, answers)) {
    for (const question of resolveScreen(screen, config, answers).questions) {
      visible.set(question.id, question);
    }
  }

  return Object.keys(answers).filter((id) => {
    if (!known.has(id)) return false;
    const question = visible.get(id);
    if (!question) return true; // the question is no longer being asked
    return !answerIsOffered(question, answers[id]);
  });
}

/**
 * Drop answers to questions that no longer apply. Returns the SAME object when
 * there is nothing to drop, so callers can skip a re-render cheaply.
 *
 * REMOVAL CASCADES, AND HAS TO. Somebody picks HMO, chooses "my HMO is not
 * listed", types the name, then goes back and switches to paying cash. One pass
 * removes `hmoId` — but `hmoOther` is gated on it, and that was still true while
 * the pass was being computed, so it survives. The result is a submitted review
 * naming an insurer for a visit the person told us they paid for themselves: a
 * fact they explicitly retracted.
 *
 * So this runs to a fixed point. The loop is bounded by the number of questions
 * because each pass removes at least one answer, and THE BOUND IS ENFORCED
 * RATHER THAN ASSUMED — a config with a circular `showWhen` must not hang the
 * browser of somebody halfway through a review.
 */
export function pruneAnswers(config, answers) {
  const known = knownIds(config);
  let current = answers;

  for (let pass = 0; pass <= known.size; pass += 1) {
    const orphans = orphansOnce(config, current, known);
    if (orphans.length === 0) return current;

    const drop = new Set(orphans);
    current = Object.fromEntries(
      Object.entries(current).filter(([id]) => !drop.has(id)),
    );
  }

  return current;
}

/**
 * The answers as they should be SENT, rather than as they were typed.
 *
 * Runs the cascade one last time — a stale answer must not reach the server just
 * because the last thing somebody did was navigate rather than change an answer
 * — and drops any free-text field holding nothing but an unfinished starter stem.
 *
 * Called at submit, not on every keystroke: clearing somebody's box mid-typing
 * because it currently matches a stem would delete the text they are still in
 * the middle of writing.
 */
export function finalizeAnswers(config, answers) {
  const pruned = pruneAnswers(config, answers);
  const next = { ...pruned };

  for (const screen of config.screens) {
    for (const question of screen.questions) {
      if (question.kind !== "text" || !question.starters) continue;
      if (!(question.id in next)) continue;
      const value = next[question.id];
      next[question.id] = meaningfulText(
        typeof value === "string" ? value : null,
        question.starters,
      );
    }
  }

  return next;
}

/**
 * Answers that no longer apply, including everything that falls away as a
 * consequence of removing them.
 */
export function orphanedAnswers(config, answers) {
  const kept = pruneAnswers(config, answers);
  return Object.keys(answers).filter((id) => !(id in kept));
}
