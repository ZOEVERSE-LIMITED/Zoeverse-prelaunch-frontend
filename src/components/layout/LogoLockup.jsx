/**
 * ZOEVERSE wordmark.
 *
 * PLACEHOLDER — THE REAL LOGO FILE IS STILL OUTSTANDING.
 * The brand mark is a five-petal lotus (red, blue, teal, yellow, green, layered
 * outer-to-centre). It is not drawn here on purpose: inventing a brand mark from
 * a written description produces something that looks approximately right and is
 * wrong, which is worse than an honest wordmark.
 *
 * TO SWAP IN THE REAL MARK: drop the supplied file at `public/zoeverse-mark.svg`
 * and add an `<img>` beside the wordmark below. Nothing else in the app needs to
 * change — every surface renders this one component.
 *
 * The wordmark is lowercase by an earlier founder decision.
 */
export function LogoLockup({ className = "" }) {
  return (
    <span className={`inline-flex items-baseline gap-2 ${className}`}>
      <span className="font-display text-title font-bold tracking-tight text-teal-ink">
        zoeverse
      </span>
    </span>
  );
}
