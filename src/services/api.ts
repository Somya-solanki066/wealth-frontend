import axios from "axios";
import { auth } from "../lib/firebase";
import { getBackendApiUrl } from "../lib/backendUrl";

const api = axios.create({
  baseURL: getBackendApiUrl(),
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to dynamically inject the Firebase ID token in headers
api.interceptors.request.use(
  async (config) => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const token = await currentUser.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Error setting Firebase Auth token in request interceptor:", error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
