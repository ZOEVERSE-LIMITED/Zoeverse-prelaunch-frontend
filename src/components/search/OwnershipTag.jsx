/**
 * Public or private, and nothing else.
 *
 * It is a neutral fact, not a judgment, so both read the same weight — no
 * green/red, no "verified" styling. A private hospital is not better than a
 * general hospital; it is a different thing, and the tag exists so somebody can
 * tell two similarly named facilities apart.
 */
export function OwnershipTag({ ownership }) {
  // A facility somebody just added themselves may have no confirmed owner, and
  // most of the registry does not record one. Rendering "Private" on a guess
  // would put an unchecked fact on screen looking exactly like a checked one, so
  // it renders nothing at all.
  if (ownership !== "public" && ownership !== "private") return null;

  return (
    <span className="inline-flex shrink-0 items-center rounded-sm border border-line bg-cream px-2 py-0.5 text-caption text-ink-muted">
      {ownership === "public" ? "Public" : "Private"}
    </span>
  );
}
