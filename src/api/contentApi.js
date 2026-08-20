import api from "@/api/axios";
import { endpoints, unwrap } from "@/api/routes";

export const contentApi = {
  getLegalDocument: async (slug, signal) => unwrap(await api.get(endpoints.legal(slug), { signal })),
};
