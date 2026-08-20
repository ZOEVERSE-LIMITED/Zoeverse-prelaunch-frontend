import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { formatPlace } from "@/lib/place";
import { OwnershipTag } from "@/components/search/OwnershipTag";
import { SearchSelect } from "./SearchSelect";



export function QuestionField({ question, value, onChange, facility, error, onSkip }) {
  const errorId = `${question.id}-error`;
  const promptId = `${question.id}-prompt`;
  const describedBy =
    [question.prompt ? promptId : null, error ? errorId : null].filter(Boolean).join(" ") ||
    undefined;

  return (
    <div>
      <fieldset>
        <legend className="text-heading font-medium text-ink">
          {question.question}
          {!question.required ? (
            <span className="ml-2 text-small font-normal text-ink-soft">Optional</span>
          ) : null}
        </legend>

        {question.prompt ? (
          <p id={promptId} className="mt-1 text-small text-ink-soft">
            {question.prompt}
          </p>
        ) : null}

        <div className="mt-4">
          <Control
            question={question}
            value={value}
            onChange={onChange}
            facility={facility}
            invalid={!!error}
            describedBy={describedBy}
          />
        </div>
      </fieldset>

      {error ? (
        <p id={errorId} role="alert" className="mt-2 text-small text-danger">
          {error}
        </p>
      ) : null}

      
      {question.kind === "text" && question.skip && onSkip ? (
        <p className="mt-3 text-small text-ink-soft">
          {question.skip.text}{" "}
          
          <button
            type="button"
            onClick={onSkip}
            className="inline-block py-1 text-teal-ink underline underline-offset-4"
          >
            {question.skip.action}
          </button>
        </p>
      ) : null}
    </div>
  );
}

function Control({ question, value, onChange, facility, invalid, describedBy }) {
  switch (question.kind) {
    case "facility_confirm":
      return (
        <FacilityConfirm
          facility={facility}
          confirmed={value === true}
          confirmLabel={question.confirmLabel}
          changeLabel={question.changeLabel}
          onConfirm={() => onChange(true)}
        />
      );

    case "rating_scale": {
      const na = question.allowNotApplicable
        ? {
            value: "NA",
            label: question.notApplicable?.label ?? "Not applicable",
          }
        : null;

      return (
        <>
          <OptionCards
            name={question.id}
            selected={value}
            onChange={onChange}
            options={[
              ...question.options.map((option) => ({
                value: option.value,
                label: option.label,
              })),
              // A quiet N/A sits with the scale. A prominent one is separated
              // below it, so an opt-out never reads as the bottom of the ladder.
              ...(na && !question.notApplicable?.prominent ? [na] : []),
            ]}
          />

          {na && question.notApplicable?.prominent ? (
            <div className="mt-4 border-t border-line pt-4">
              <OptionCards
                name={question.id}
                selected={value}
                onChange={onChange}
                options={[na]}
              />
            </div>
          ) : null}
        </>
      );
    }

    case "single_choice":
      // A long list is a different interaction, not a different question.
      return question.searchable ? (
        <SearchSelect
          id={question.id}
          options={question.options}
          value={typeof value === "string" ? value : null}
          onChange={onChange}
          invalid={invalid}
          describedBy={describedBy}
        />
      ) : (
        <OptionCards
          name={question.id}
          selected={value}
          onChange={onChange}
          options={question.options.map((option) => ({
            value: option.value,
            label: option.label,
            description: option.description,
          }))}
        />
      );

    case "boolean":
      return (
        <OptionCards
          name={question.id}
          selected={value}
          onChange={onChange}
          options={[
            { value: true, label: question.trueLabel },
            { value: false, label: question.falseLabel },
          ]}
        />
      );

    case "text":
      return (
        <TextAnswer
          question={question}
          value={typeof value === "string" ? value : ""}
          onChange={onChange}
          invalid={invalid}
          describedBy={describedBy}
        />
      );

    case "multi_choice":
      return (
        <CheckboxList
          id={question.id}
          options={question.options}
          selected={Array.isArray(value) ? value : []}
          onChange={onChange}
          collapsible={!!question.collapsible}
          emptySummary={question.emptySummary ?? "Tap to choose"}
        />
      );

    default:
      /*
        AN HONEST MESSAGE BEATS A BLANK SPACE, and beats a white screen by more.
        A question kind this build does not know about means the server is ahead
        of the client. Crashing here would take the whole review with it; this
        leaves every other question on the screen answerable.
      */
      return (
        <p className="rounded border border-dashed border-line px-4 py-3 text-small text-ink-soft">
          This question cannot be shown in this version. You can carry on without
          it.
        </p>
      );
  }
}

/**
 * A free-text answer, with optional openers above it.
 *
 * A CHIP INSERTS AT THE CURSOR AND HANDS THE FIELD BACK. It is a way in, not a
 * template: the caret lands after the stem so the next thing that happens is the
 * person typing their own words. Tapping a second chip mid-sentence inserts
 * there rather than starting over, because somebody adding a second thought
 * should not lose the first.
 */
function TextAnswer({ question, value, onChange, invalid, describedBy }) {
  const field = useRef(null);

  /**
   * Where the caret should land once the inserted text has rendered.
   *
   * NOT `requestAnimationFrame`. A hidden or backgrounded document does not run
   * animation frames at all, so the focus call simply never happens — the text
   * appears and the keyboard does not, with nothing to explain why. An effect
   * runs after every commit regardless of whether the page is painting.
   */
  const pendingCaret = useRef(null);

  useEffect(() => {
    if (pendingCaret.current === null) return;
    const caret = pendingCaret.current;
    pendingCaret.current = null;
    field.current?.focus();
    field.current?.setSelectionRange(caret, caret);
  });

  function insert(stem) {
    const el = field.current;
    // With no cursor to read — the field was never focused — append rather than
    // overwrite. Landing at position 0 would push existing text along in front
    // of the stem, which reads as a bug.
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? start;

    const before = value.slice(0, start);
    const after = value.slice(end);
    // Space the stem off from whatever is already there, on either side, but
    // never double up on whitespace that exists. Inserting at a word boundary is
    // the common case and it should not leave a visible gap.
    const lead = before.length > 0 && !/\s$/.test(before) ? " " : "";
    const trail = /^\s/.test(after) ? "" : " ";
    const snippet = `${lead}${stem}${trail}`;

    const next = (before + snippet + after).slice(0, question.maxLength);
    onChange(next);

    // Applied by the effect above, once the new value has actually rendered:
    // caret at the end of what was inserted, keyboard handed back.
    pendingCaret.current = Math.min((before + snippet).length, question.maxLength);
  }

  const box = `w-full rounded border bg-surface px-4 py-3 text-body text-ink placeholder:text-ink-soft focus:border-teal-ink ${
    invalid ? "border-danger" : "border-line"
  }`;

  return (
    <div>
      {question.starters && question.starters.length > 0 ? (
        <div className="mb-3 flex flex-wrap gap-2">
          {question.starters.map((stem) => (
            <button
              key={stem}
              type="button"
              onClick={() => insert(stem)}
              className="inline-flex min-h-tap items-center rounded-full border border-line bg-surface px-4 py-2 text-small text-teal-ink hover:border-teal-ink hover:bg-teal-wash"
            >
              {stem}
            </button>
          ))}
        </div>
      ) : null}

      {question.multiline ? (
        <textarea
          id={question.id}
          ref={field}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={question.maxLength}
          placeholder={question.placeholder}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={`min-h-[8rem] ${box}`}
        />
      ) : (
        <input
          id={question.id}
          ref={field}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={question.maxLength}
          placeholder={question.placeholder}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={`min-h-tap ${box}`}
        />
      )}
    </div>
  );
}

/**
 * Multi-select, optionally collapsed behind a summary.
 *
 * REAL CHECKBOXES, NOT A NATIVE MULTI-SELECT. A `<select multiple>` on Android
 * is a scroll box that requires a long-press to add a second item, and most
 * people never discover it. Checkboxes are obvious and each row is a full tap
 * target.
 *
 * The disclosure is a button plus a region, not `<details>`, so the summary can
 * report the running count and the whole thing stays controlled.
 */
function CheckboxList({ id, options, selected, onChange, collapsible, emptySummary }) {
  // Opens automatically when something is already picked — coming back to a
  // collapsed box that says "3 chosen" and having to reopen it to see which
  // three is a small, avoidable annoyance.
  const [open, setOpen] = useState(!collapsible || selected.length > 0);

  function toggle(value) {
    const next = selected.includes(value)
      ? selected.filter((entry) => entry !== value)
      : [...selected, value];
    // An empty array is stored as null, so "asked and skipped" does not read as
    // "answered with nothing".
    onChange(next.length > 0 ? next : null);
  }

  const chosen = options.filter((option) => selected.includes(option.value));
  const summary =
    chosen.length === 0
      ? emptySummary
      : chosen.length <= 2
        ? chosen.map((option) => option.label).join(", ")
        : `${chosen.length} chosen`;

  const list = (
    <div id={`${id}-options`} className="space-y-2">
      {options.map((option) => {
        const checked = selected.includes(option.value);
        return (
          <label
            key={option.value}
            className={`zoe-focus-row flex min-h-tap cursor-pointer items-center gap-3 rounded border px-4 py-3 ${
              checked ? "border-teal-ink bg-teal-wash" : "border-line bg-surface"
            }`}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => toggle(option.value)}
              className="h-5 w-5 shrink-0 accent-teal-ink"
            />
            <span className="text-body text-ink">{option.label}</span>
          </label>
        );
      })}
    </div>
  );

  if (!collapsible) return list;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((was) => !was)}
        aria-expanded={open}
        aria-controls={`${id}-options`}
        className="flex min-h-tap w-full items-center justify-between gap-3 rounded border border-line bg-surface px-4 py-3 text-left"
      >
        <span className={chosen.length ? "text-body text-ink" : "text-body text-ink-soft"}>
          {summary}
        </span>
        <span aria-hidden className="shrink-0 text-small text-teal-ink">
          {open ? "Close ▲" : "Open ▼"}
        </span>
      </button>

      {open ? <div className="mt-2">{list}</div> : null}
    </div>
  );
}

/**
 * Radio cards.
 *
 * SCALES ARE NEVER DROPDOWNS. Collapsing a 1–5 ladder behind a select hides the
 * range somebody is choosing within and measurably biases the answers. Every
 * option is visible, and every one is a full-width tap target.
 */
function OptionCards({ name, options, selected, onChange }) {
  return (
    <div className="space-y-2">
      {options.map((option) => {
        const checked = selected === option.value;
        return (
          <label
            key={String(option.value)}
            className={`zoe-focus-row flex min-h-tap cursor-pointer items-start gap-3 rounded border px-4 py-3 ${
              checked ? "border-teal-ink bg-teal-wash" : "border-line bg-surface"
            }`}
          >
            <input
              type="radio"
              name={name}
              checked={checked}
              onChange={() => onChange(option.value)}
              className="mt-1 h-5 w-5 shrink-0 accent-teal-ink"
            />
            <span>
              <span className="block text-body text-ink">{option.label}</span>
              {option.description ? (
                <span className="mt-0.5 block text-small text-ink-soft">
                  {option.description}
                </span>
              ) : null}
            </span>
          </label>
        );
      })}
    </div>
  );
}

/** Confirm the facility, or go back and pick another one. */
function FacilityConfirm({ facility, confirmed, confirmLabel, changeLabel, onConfirm }) {
  return (
    <div>
      <div className="rounded border border-line bg-surface px-4 py-4">
        <p className="text-heading font-medium text-ink">{facility.name}</p>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-small text-ink-muted">
            {formatPlace(facility.area, facility.lga)}
          </span>
          <OwnershipTag ownership={facility.ownership} />
        </p>
        {facility.address ? (
          <p className="mt-1 text-small text-ink-soft">{facility.address}</p>
        ) : null}
      </div>

      <label
        className={`zoe-focus-row mt-3 flex min-h-tap cursor-pointer items-center gap-3 rounded border px-4 py-3 ${
          confirmed ? "border-teal-ink bg-teal-wash" : "border-line bg-surface"
        }`}
      >
        <input
          type="radio"
          name="facilityConfirmed"
          checked={confirmed}
          onChange={onConfirm}
          className="h-5 w-5 shrink-0 accent-teal-ink"
        />
        <span className="text-body text-ink">{confirmLabel}</span>
      </label>

      {/* A link, not a radio. Picking the wrong facility means leaving this
          review entirely, and dressing that up as a third option in a list would
          make it look reversible from here. */}
      <Link
        to="/"
        className="mt-3 inline-flex min-h-tap items-center text-body text-teal-ink underline underline-offset-4"
      >
        {changeLabel}
      </Link>
    </div>
  );
}
