import api from "@/api/axios";
import { endpoints, unwrap } from "@/api/routes";

export const facilitiesApi = {
  search: async ({ query, limit }, signal) =>
    unwrap(await api.get(endpoints.facilities.list, { params: { query, limit }, signal })),
  searchExternal: async (query, signal) =>
    unwrap(await api.get(endpoints.facilities.externalSearch, { params: { query }, signal })),
  get: async (id, signal) => unwrap(await api.get(endpoints.facilities.detail(id), { signal })),
  suggest: async (payload) => unwrap(await api.post(endpoints.facilities.suggest, payload)),
};
