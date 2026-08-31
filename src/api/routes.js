
export const endpoints = {
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


export function unwrap(response) {
  const body = response.data;
  return body && typeof body === "object" && "data" in body ? body.data : body;
}
