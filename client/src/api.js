import axios from "axios";

export const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000,
});

export const getApiError = (error) => {
  if (error.code === "ERR_NETWORK") {
    return `Cannot reach the ATS API at ${apiBaseUrl}. Start the app with "npm run dev" and confirm server/.env contains a valid MONGODB_URI.`;
  }
  if (error.code === "ECONNABORTED") {
    return "The ATS API took too long to respond. Check that the API and MongoDB are running, then try again.";
  }
  return error.response?.data?.message || error.message || "Something went wrong. Please try again.";
};

export default api;
