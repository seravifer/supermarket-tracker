import axios from "axios";
import { wait } from "./utils.js";

const map = new Map<string, number>();

axios.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response.status === 429) {
      const id = error.config.url;
      const value = map.get(id) ?? 1;
      await wait(1000 * value);
      map.set(id, value + 1);
      console.log("Retry request", id, value);
      return axios.request(error.config);
    }
    return Promise.reject(error);
  }
);

export const http = axios;
