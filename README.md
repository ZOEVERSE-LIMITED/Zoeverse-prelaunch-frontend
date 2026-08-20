# ZOEVERSE — pre-launch review page (React + Vite)

The public page where any Nigerian can review any Lagos health facility, before
ZOEVERSE launches. It collects reviews and displays nothing — no facility
profiles, no Trust Scores, no listings of other people's reviews.

**React + Vite + Tailwind, plain JavaScript.** No TypeScript, no framework
server, no bundled data.

---

## Running it

```bash
npm install
npm run dev
```

Then open **http://localhost:5181**.

The backend is expected on **http://localhost:4000**. Requests go to `/api/...`
on this same origin and Vite forwards them, so there is no CORS to configure.
Point it somewhere else by copying `.env.example` to `.env` and changing
`VITE_DEV_API_PROXY`.

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server on 5181 |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the built files locally |
| `npm run lint` | ESLint |

**Without a backend the site still runs** and every screen shows its honest
failure state — "We could not reach ZOEVERSE." That is the design, not a bug:
there is no bundled data to fall back on.

---

## What this project deliberately does not contain

No facility list, no HMO register, no question text, no consent wording, no legal
copy, no mock data of any kind. The previous build shipped all of it as fixtures;
this one holds none.

That has one consequence worth stating plainly: **this front end cannot be
demonstrated on its own.** It needs the API. In exchange, there is no second copy
of the questions to drift out of step with the real one, and nothing invented can
ever reach a screen.

Everything the backend must provide is in **`API-CONTRACT.md`**, and in full
detail in the comments above each function in `src/lib/api/`.

---

## The shape of it

```
src/
  lib/
    api/          the ONLY code that talks to a server. One file per resource,
                  each carrying its endpoint's full contract in comments.
    review/
      rules.js    the routing engine — visibility, variants, pronouns, and the
                  cascade that drops answers which stop applying. Pure.
      draft.js    answers, in localStorage
      session.js  the verification token, in sessionStorage (dies with the tab)
    phone.js      Nigerian number normalisation → E.164
  components/     rendering only; no question text, no option labels, no ordering
  pages/          one file per route
  styles/
    tokens.css    THE ONLY PLACE A COLOUR IS WRITTEN DOWN
```

## The flow

```
/                              search for a facility
/review/:id/start              screen 0 — phone, then the code
/review/:id                    the questions
/review/:id/verify             consent, then send
/thank-you
```

**Verification is first.** It used to be last, which meant a mistyped code or a
flat battery cost somebody the whole review they had just written. Verifying
first costs thirty seconds and makes every answer after it recoverable.

**Consent stays last**, and did not move with it. It is agreement to publish a
specific review, and at the start of the flow that review does not exist yet.

---

## Rules that must survive future edits

- **No score, anywhere.** No Trust Score, no average, no star rating, no other
  person's review, on any screen. Answers are collected raw and passed through;
  nothing is calculated here.
- **The client owns no content.** A component that hardcodes a question label has
  broken the contract — the day somebody changes that wording server-side, this
  page quietly keeps asking the old one.
- **No fallback content on failure.** Especially consent: showing wording we
  invented locally would record somebody agreeing to words a lawyer never wrote.
- **`"NA"` is a string, never `0`.**
- **The raw phone number is never stored** — not in a draft, not in a URL, not in
  a log. Only the opaque token and the server's mask.
- **Every colour comes from `tokens.css`.** There is one documented exception:
  the `theme-color` meta tag in `index.html`, which cannot resolve a CSS
  variable. Keep it in step with `--zoe-cream`.
- **44px minimum tap target, 16px minimum font.** Below 16px iOS zooms the page
  on focus. There is exactly one documented exception, and it is commented where
  it lives.

---

## Still outstanding

- **The real logo.** `LogoLockup.jsx` is a text wordmark and `favicon.svg` is a
  placeholder letter. The five-petal lotus has never been supplied as a file, and
  drawing one from a description would look approximately right and be wrong.
- **Legal copy.** The privacy notice and terms are drafts with visible
  `{{PLACEHOLDER}}` gaps, served by the API. The consent screen already asks
  people to agree to the terms, so these are on the critical path to launch.
- **Two contact details**, currently rendered as visible placeholders: the
  withdrawal contact on the consent screen, and the support contact on the
  "you have already reviewed this one" screen.
