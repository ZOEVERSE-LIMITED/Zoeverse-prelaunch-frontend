import { Link } from "react-router-dom";

/**
 * The one button in the product.
 *
 * `primary` is a teal fill with a white label: 4.67:1, which clears AA. That
 * pairing is why #028090 is allowed as a fill but never as text on cream.
 *
 * Every variant is at least 44px tall and full-width on mobile. This is pressed
 * with a thumb, one-handed, often while walking.
 */
const base =
  "inline-flex min-h-tap items-center justify-center gap-2 rounded px-5 py-3 text-body font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60";

const variants = {
  primary: "bg-teal text-surface hover:bg-teal-ink active:bg-teal-deep",
  secondary:
    "border border-line bg-surface text-teal-ink hover:border-teal-ink active:bg-teal-wash",
};

export function Button({ variant = "primary", className = "", children, ...props }) {
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function ButtonLink({ variant = "primary", className = "", children, ...props }) {
  return (
    <Link className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </Link>
  );
}
