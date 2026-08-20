import axios from "axios";

/**
 * Shared HTTP client. Leave VITE_API_URL unset while developing to use Vite's
 * `/api` proxy; set it to the deployed API origin in production.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = window.localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // An aborted request is expected when a user changes search text or leaves
    // a page. Keep Axios's cancellation information intact for the caller.
    if (error.code === "ERR_CANCELED") return Promise.reject(error);

    const body = error.response?.data;
    return Promise.reject({
      name: "ApiError",
      status: error.response?.status ?? 0,
      code: body?.code ?? "request_failed",
      fieldErrors: body?.fieldErrors ?? body?.errors,
      retryAfterSeconds: body?.retryAfterSeconds,
      isRetryable: !error.response || error.response.status >= 500,
      message: body?.message ?? error.message ?? "Request failed",
    });
  },
);

export default api;
