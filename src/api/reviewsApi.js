import api from "@/api/axios";
import { endpoints, unwrap } from "@/api/routes";

export const reviewsApi = {
  getForm: async (facilityId, version, signal) =>
    unwrap(await api.get(endpoints.reviews.form, { params: { facilityId, version }, signal })),
  getConsent: async (formVersion, signal) =>
    unwrap(await api.get(endpoints.reviews.consent, { params: { formVersion }, signal })),
  startSession: async (payload) => unwrap(await api.post(endpoints.reviews.startSession, payload)),
  saveSession: async ({ draftId, ...payload }) =>
    unwrap(await api.patch(endpoints.reviews.saveSession(draftId), payload)),
  submit: async (payload) => unwrap(await api.post(endpoints.reviews.submit, payload)),
};
