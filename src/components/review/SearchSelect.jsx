import { useMemo, useState } from "react";

/**
 * A long list you type to filter — the HMO register, ~94 entries.
 *
 * NOT A NATIVE `<select>`: ninety options in a native picker on Android is a
 * scroll wheel somebody gives up on. Not a floating combobox either — the list
 * renders inline and pushes the page down, because an overlay positioned near
 * the bottom of a small screen ends up under the keyboard.
 *
 * The value stored is always `option.value`, never the label. Today that may be
 * a slug; when the NHIA register lands it becomes the accreditation id, and
 * nothing else has to change.
 */
export function SearchSelect({
  id,
  options,
  value,
  onChange,
  invalid,
  describedBy,
  placeholder = "Type to search",
}) {
  const [query, setQuery] = useState("");
  const selected = options.find((option) => option.value === value) ?? null;

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return options;
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(needle) ||
        // "My HMO is not listed" must stay findable however somebody searches,
        // because the people who need it are the ones whose search failed. It is
        // matched on the SERVER'S FLAG, not on a hardcoded "OTHER" — the list
        // belongs to the server and its codes are the server's to change.
        option.isOther,
    );
  }, [options, query]);

  if (options.length === 0) {
    return (
      <p className="rounded border border-line bg-surface px-4 py-3 text-small text-ink-muted">
        We could not load the list. Reload the page to try again.
      </p>
    );
  }

  return (
    <div>
      {selected ? (
        <div className="flex items-center justify-between gap-3 rounded border border-teal-ink bg-teal-wash px-4 py-3">
          <span className="text-body text-ink">{selected.label}</span>
          <button
            type="button"
            onClick={() => {
              onChange("");
              setQuery("");
            }}
            className="min-h-tap shrink-0 rounded px-2 text-small text-teal-ink underline underline-offset-4"
          >
            Change
          </button>
        </div>
      ) : (
        <>
          <input
            id={id}
            type="search"
            inputMode="search"
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            aria-controls={`${id}-list`}
            className={`min-h-tap w-full rounded border bg-surface px-4 py-3 text-body text-ink placeholder:text-ink-soft focus:border-teal-ink ${
              invalid ? "border-danger" : "border-line"
            }`}
          />

          <p className="sr-only" aria-live="polite">
            {filtered.length} of {options.length} shown
          </p>

          {/* Capped height so a long list cannot bury the Continue button
              somewhere off the bottom of a 360px screen. */}
          <ul
            id={`${id}-list`}
            className="mt-2 max-h-64 space-y-1 overflow-y-auto rounded border border-line bg-surface p-1"
          >
            {filtered.map((option) => (
              <li key={option.value}>
                <button
                  type="button"
                  onClick={() => onChange(option.value)}
                  className="flex min-h-tap w-full items-center rounded px-3 py-2 text-left text-body text-ink hover:bg-teal-wash"
                >
                  {option.label}
                </button>
              </li>
            ))}

            {filtered.length === 0 ? (
              <li className="px-3 py-3 text-small text-ink-muted">Nothing matches that.</li>
            ) : null}
          </ul>
        </>
      )}
    </div>
  );
}
