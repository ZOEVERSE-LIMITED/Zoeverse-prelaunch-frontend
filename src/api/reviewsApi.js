import api from "@/api/axios";
import { endpoints, unwrap } from "@/api/routes";

export const reviewsApi = {
  journeyEvent: async (draftId, event) => api.post(`/review-sessions/${encodeURIComponent(draftId)}/events`, event, { timeout: 5000 }),
  getForm: async (facilityId, version, signal) =>
    unwrap(await api.get(endpoints.reviews.form, { params: { facilityId, version }, signal })),
  getConsent: async (formVersion, signal) =>
    unwrap(await api.get(endpoints.reviews.consent, { params: { formVersion }, signal })),
  startSession: async (payload) => unwrap(await api.post(endpoints.reviews.startSession, payload)),
  resumeSession: async (token) => unwrap(await api.post("/review-sessions/resume", { token })),
  discardSession: async (draftId) => api.delete(endpoints.reviews.saveSession(draftId)),
  unsubscribeNewsletter: async (token) => unwrap(await api.post('/newsletter/unsubscribe', { token })),
  saveSession: async ({ draftId, ...payload }) =>
    unwrap(await api.patch(endpoints.reviews.saveSession(draftId), payload)),
  submit: async (payload) => unwrap(await api.post(endpoints.reviews.submit, payload)),
};
