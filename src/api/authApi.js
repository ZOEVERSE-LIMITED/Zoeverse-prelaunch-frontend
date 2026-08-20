import api from "@/api/axios";
import { endpoints, unwrap } from "@/api/routes";

export const authApi = {
  requestOtp: async (phone) => unwrap(await api.post(endpoints.auth.requestOtp, { phone })),
  verifyOtp: async (challengeId, code) =>
    unwrap(await api.post(endpoints.auth.verifyOtp, { challengeId, code })),
};
