import { authApi } from "@/api/authApi";
import { contentApi } from "@/api/contentApi";
import { facilitiesApi } from "@/api/facilitiesApi";
import { reviewsApi } from "@/api/reviewsApi";


export const requestOtp = authApi.requestOtp;
export const verifyOtp = authApi.verifyOtp;
export const searchFacilities = facilitiesApi.search;
export const searchExternalFacilities = facilitiesApi.searchExternal;
export const getFacility = facilitiesApi.get;
export const suggestFacility = facilitiesApi.suggest;
export const getReviewForm = reviewsApi.getForm;
export const getConsentNotice = reviewsApi.getConsent;
export const startReviewSession = reviewsApi.startSession;
export const saveReviewSession = reviewsApi.saveSession;
export const submitReview = reviewsApi.submit;
export const getLegalDocument = contentApi.getLegalDocument;

export function isApiError(error) {
  return error?.name === "ApiError";
}
