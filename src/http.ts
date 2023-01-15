import axios from "axios";
import axiosRetry from "axios-retry";

// @ts-ignore
axiosRetry(axios, { retries: 3, retryDelay: () => 3000, retryCondition: () => true });

export const http = axios;
