import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { searchExternalFacilities, searchFacilities } from "@/api";
import { formatPlace } from "@/lib/place";
import { OwnershipTag } from "./OwnershipTag";

/* =========================================================================
   FACILITY TYPE-AHEAD
   =========================================================================
   THIS COMPONENT DOES NOT MATCH, FILTER OR RANK ANYTHING. It sends what was
   typed to `searchFacilities` and renders what comes back, in the order it comes
   back. All the forgiving-search behaviour lives behind the API boundary.

   RESULTS ARE REAL LINKS, NOT AN ARIA COMBOBOX. A combobox needs
   aria-activedescendant, roving selection and a keyboard model, and every one of
   those is a way for selection to break on a phone browser. Anchors are
   tab-reachable, announced correctly by every screen reader, and can be
   long-pressed. The list is short enough that the extra tab stops cost nothing.

   NOTHING AUTO-SELECTS. There is no "jump to the top result" on Enter. LUTH and
   LASUTH are different hospitals in different LGAs and are routinely confused;
   guessing which one somebody meant is how a review lands on the wrong facility.
   ========================================================================= */

/**
 * Wait this long after the last keystroke before asking the server.
 *
 * Not a performance micro-optimisation: on a metered Nigerian data plan a
 * request per keystroke is somebody's airtime. 250ms is short enough to feel
 * immediate and long enough that typing a word costs one request, not seven.
 */
const DEBOUNCE_MS = 250;

/** Below this, results are noise — "la" matches half of Lagos. */
const MIN_QUERY = 2;

/** A shortlist to pick from. More than this is a list to read. */
const MAX_RESULTS = 8;

export function FacilitySearch() {
  const inputId = useId();
  const hintId = useId();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState("idle"); // idle | searching | done | error

  /**
   * Guards against out-of-order responses. On patchy data the request for "lu"
   * can land after the request for "luth" and overwrite good results with worse
   * ones. Only the newest request may set state.
   */
  const latest = useRef(0);

  const trimmed = query.trim();
  const tooShort = trimmed.length > 0 && trimmed.length < MIN_QUERY;
  const searching = trimmed.length >= MIN_QUERY;

  useEffect(() => {
    if (trimmed.length < MIN_QUERY) {
      latest.current += 1; // invalidate anything in flight
      setResults([]);
      setTotal(0);
      setStatus("idle");
      return;
    }

    setStatus("searching");
    const ticket = (latest.current += 1);

    const timer = setTimeout(async () => {
      try {
        const page = await searchFacilities({ query: trimmed, limit: MAX_RESULTS });
        if (ticket !== latest.current) return;
        setResults(page.results ?? []);
        setTotal(page.total ?? 0);
        setStatus("done");
      } catch {
        if (ticket !== latest.current) return;
        setResults([]);
        setTotal(0);
        setStatus("error");
        // Deliberately not logged. What somebody searches for on a health
        // platform can reveal a condition.
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [trimmed]);

  const suggestHref = trimmed
    ? `/facility/suggest?name=${encodeURIComponent(trimmed)}`
    : "/facility/suggest";

  return (
    <div>
      <label htmlFor={inputId} className="block text-body font-medium text-ink">
        Where did you go?
      </label>

      <input
        id={inputId}
        type="search"
        inputMode="search"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Hospital name or area"
        aria-describedby={hintId}
        className="mt-2 min-h-tap w-full rounded border border-line bg-surface px-4 py-3 text-body text-ink placeholder:text-ink-soft focus:border-teal-ink"
      />

      <p id={hintId} className="mt-2 text-small text-ink-soft">
        Try a name like LUTH, or an area like Surulere.
      </p>

      {/* Announced without stealing focus, so a screen reader user knows results
          arrived while they are still in the input. */}
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {status === "searching"
          ? "Searching"
          : status === "done"
            ? results.length === 0
              ? "No facilities found"
              : `${results.length} of ${total} ${total === 1 ? "facility" : "facilities"} shown`
            : status === "error"
              ? "Search failed"
              : ""}
      </p>

      {tooShort ? (
        <p className="mt-4 text-small text-ink-soft">
          Keep typing — at least <span className="num">2</span> letters.
        </p>
      ) : null}

      {searching ? (
        <div className="mt-4">
          {status === "searching" && results.length === 0 ? <ResultsSkeleton /> : null}

          {status === "error" ? (
            <div className="rounded border border-line bg-surface px-4 py-4">
              <p className="text-body text-ink">We could not reach ZOEVERSE.</p>
              <p className="mt-1 text-small text-ink-muted">
                Check your connection, then change the search to try again.
              </p>
            </div>
          ) : null}

          {results.length > 0 ? (
            <>
              <ul className="space-y-2">
                {results.map((facility) => (
                  <li key={facility.id}>
                    <Link
                      // Straight to screen 0. `/review/:id` would redirect here
                      // anyway, and a redirect somebody can see is a flash of the
                      // wrong screen on a slow phone.
                      to={`/review/${encodeURIComponent(facility.id)}/start`}
                      className="flex min-h-tap flex-col items-start gap-1 rounded border border-line bg-surface px-4 py-3 hover:border-teal-ink hover:bg-teal-wash"
                    >
                      <span className="text-body font-medium text-ink">
                        {facility.name}
                      </span>
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-small text-ink-muted">
                          {formatPlace(facility.area, facility.lga)}
                        </span>
                        <OwnershipTag ownership={facility.ownership} />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>

              {total > results.length ? (
                <p className="mt-3 text-small text-ink-soft">
                  Showing <span className="num">{results.length}</span> of{" "}
                  <span className="num">{total}</span>. Add the area to narrow it
                  down.
                </p>
              ) : null}

              {/* Matching is forgiving, so "found something" does not mean "found
                  yours". This is the way out of a weak match. */}
              <ExternalMatches query={trimmed} fallbackHref={suggestHref} autoRun={false} />
            </>
          ) : null}

          {status === "done" && results.length === 0 ? (
            <div className="rounded border border-line bg-surface px-4 py-5">
              <p className="text-body font-medium text-ink">Not on our list yet</p>

              {/*
                THE FALLBACK ONLY RUNS HERE — when our own registry has nothing.
                Places is billed per request, and firing it alongside every search
                would pay for results nobody needed.
              */}
              <ExternalMatches query={trimmed} fallbackHref={suggestHref} autoRun />
            </div>
          ) : null}
        </div>
      ) : (
        <p className="mt-6 text-small text-ink-muted">
          Can&apos;t find it?{" "}
          <Link to="/facility/suggest" className="text-teal-ink underline underline-offset-4">
            Add a facility
          </Link>
        </p>
      )}
    </div>
  );
}

/**
 * Facilities found outside our registry, shown only when our own has nothing.
 *
 * EVERY ONE IS LABELLED UNVERIFIED, and picking one does NOT start a review
 * against it. It pre-fills the add-a-facility form instead, so the record still
 * goes through the same check as one somebody typed by hand. The upstream source
 * has no idea which of these is licensed; ZOEVERSE's entire premise is that we
 * do.
 */
function ExternalMatches({ query, fallbackHref, autoRun }) {
  const [candidates, setCandidates] = useState([]);
  const [looking, setLooking] = useState(false);
  const [asked, setAsked] = useState(false);
  const latest = useRef(0);

  const run = useCallback(() => {
    if (query.length < 3) {
      setCandidates([]);
      return;
    }

    setAsked(true);
    setLooking(true);
    const ticket = (latest.current += 1);

    searchExternalFacilities(query)
      .then((found) => {
        if (ticket === latest.current) setCandidates(found);
      })
      .catch(() => {
        // A failed or unconfigured lookup is not the patient's problem, and there
        // is nothing for them to do about it. Fall silently back to typing the
        // facility in, which always works.
        if (ticket === latest.current) setCandidates([]);
      })
      .finally(() => {
        if (ticket === latest.current) setLooking(false);
      });
  }, [query]);

  // Reset when the query changes, so a stale answer never sits under a new one.
  useEffect(() => {
    setCandidates([]);
    setAsked(false);
    latest.current += 1;
    if (autoRun) run();
  }, [query, autoRun, run]);

  if (!autoRun && !asked) {
    return (
      <p className="mt-4 text-small text-ink-muted">
        Not the right one?{" "}
        <button
          type="button"
          onClick={run}
          className="min-h-tap rounded text-teal-ink underline underline-offset-4"
        >
          Search wider
        </button>{" "}
        or{" "}
        <Link to={fallbackHref} className="text-teal-ink underline underline-offset-4">
          add a facility
        </Link>
      </p>
    );
  }

  return (
    <>
      {looking ? <p className="mt-1 text-small text-ink-soft">Checking…</p> : null}

      {candidates.length > 0 ? (
        <>
          <p className="mt-1 text-small text-ink-muted">
            Found outside our list. Pick yours and we will add it — the ZOEVERSE
            team checks every facility before it goes on the list.
          </p>

          <ul className="mt-3 space-y-2">
            {candidates.map((candidate) => (
              <li key={candidate.providerPlaceId}>
                <Link
                  to={`/facility/suggest?name=${encodeURIComponent(candidate.name)}&area=${encodeURIComponent(candidate.addressLine ?? "")}&placeId=${encodeURIComponent(candidate.providerPlaceId)}`}
                  className="flex min-h-tap flex-col items-start gap-1 rounded border border-line bg-cream px-4 py-3 hover:border-teal-ink"
                >
                  <span className="text-body font-medium text-ink">{candidate.name}</span>
                  {candidate.addressLine ? (
                    <span className="text-small text-ink-muted">
                      {candidate.addressLine}
                    </span>
                  ) : null}
                  <span className="text-caption text-ink-soft">
                    Not verified by ZOEVERSE yet
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          {/* Attribution is required when Places results are shown outside a
              Google map. The BACKEND decides whether that is the source, so it
              tells us — the client no longer knows or assumes. */}
          {candidates.some((c) => c.provider === "google") ? (
            <p className="mt-3 text-caption text-ink-soft">Powered by Google</p>
          ) : null}
        </>
      ) : null}

      <p className="mt-4 text-small text-ink-muted">
        {looking
          ? ""
          : candidates.length > 0
            ? "None of these?"
            : "Nothing found there either. Add it yourself so you can review it."}
      </p>
      <Link
        to={fallbackHref}
        className="mt-3 inline-flex min-h-tap w-full items-center justify-center rounded bg-teal px-5 py-3 text-body font-medium text-surface sm:w-auto"
      >
        Add this facility
      </Link>
    </>
  );
}

/**
 * Three grey rows while the request is out. A spinner tells somebody to wait;
 * this tells them what is arriving, and stops the page jumping when it does.
 */
function ResultsSkeleton() {
  return (
    <ul aria-hidden className="space-y-2">
      {[0, 1, 2].map((row) => (
        <li key={row} className="min-h-tap rounded border border-line bg-surface px-4 py-3">
          <span className="block h-4 w-3/5 rounded-sm bg-line" />
          <span className="mt-2 block h-3 w-2/5 rounded-sm bg-line" />
        </li>
      ))}
    </ul>
  );
}
