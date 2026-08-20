/**
 * Form field primitives.
 *
 * Rules baked in here rather than left to each screen:
 *   - Every control is at least 44px tall and 16px text. Below 16px, iOS zooms
 *     the whole page on focus, which on a form is disorienting.
 *   - An error is tied to its input with `aria-describedby` and marked
 *     `aria-invalid`, so it is announced rather than merely coloured. Colour
 *     alone is not an error message.
 *   - Errors say what to do. They do not apologise.
 */

const controlBase =
  "min-h-tap w-full rounded border bg-surface px-4 py-3 text-body text-ink placeholder:text-ink-soft focus:border-teal-ink";

function controlClass(invalid) {
  return `${controlBase} ${invalid ? "border-danger" : "border-line"}`;
}

export function Field({ label, htmlFor, hint, error, optional, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-body font-medium text-ink">
        {label}
        {optional ? (
          <span className="ml-2 text-small font-normal text-ink-soft">Optional</span>
        ) : null}
      </label>

      {hint ? (
        <p id={`${htmlFor}-hint`} className="mt-1 text-small text-ink-soft">
          {hint}
        </p>
      ) : null}

      <div className="mt-2">{children}</div>

      {error ? (
        <p id={`${htmlFor}-error`} className="mt-2 text-small text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Wire a control to its hint and error without repeating the ids everywhere.
 * Both flags must match what `Field` actually rendered, or a control ends up
 * pointing at an element that does not exist.
 */
export function describedBy(id, hasHint, hasError) {
  const parts = [hasHint ? `${id}-hint` : null, hasError ? `${id}-error` : null].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : undefined;
}

export function TextInput({ invalid, className = "", ...props }) {
  return (
    <input
      {...props}
      aria-invalid={invalid || undefined}
      className={`${controlClass(invalid)} ${className}`}
    />
  );
}

export function TextArea({ invalid, className = "", ...props }) {
  return (
    <textarea
      {...props}
      aria-invalid={invalid || undefined}
      className={`${controlClass(invalid)} min-h-[6rem] ${className}`}
    />
  );
}
