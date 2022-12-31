import axios from "axios";
import axiosRetry from "axios-retry";

// @ts-ignore
axiosRetry(axios, { retries: 3, retryDelay: axiosRetry.exponentialDelay });

export const http = axios;
