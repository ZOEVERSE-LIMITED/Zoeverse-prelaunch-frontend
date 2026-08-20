
export const endpoints = {
  auth: {
    requestOtp: "/users/send-otp",
    verifyOtp: "/users/verify-otp",
  },
  facilities: {
    list: "/facilities",
    externalSearch: "/facilities/external-search",
    suggest: "/facilities/suggestions",
    detail: (id) => `/facilities/${encodeURIComponent(id)}`,
  },
  reviews: {
    form: "/review-form",
    consent: "/review-form/consent",
    startSession: "/review-sessions",
    saveSession: (draftId) => `/review-sessions/${encodeURIComponent(draftId)}`,
    submit: "/reviews",
  },
  legal: (slug) => `/legal/${encodeURIComponent(slug)}`,
};

/** Supports both `{ ... }` and `{ data: { ... } }` backend responses. */
export function unwrap(response) {
  const body = response.data;
  return body && typeof body === "object" && "data" in body ? body.data : body;
}
