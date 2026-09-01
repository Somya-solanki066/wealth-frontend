import axios from "axios";
import { auth } from "../lib/firebase";
import { getBackendApiUrl } from "../lib/backendUrl";

const api = axios.create({
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  async (config) => {
    config.baseURL = getBackendApiUrl();
    console.log("🔥 API BASE URL:", config.baseURL);
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
  (error) => Promise.reject(error)
);

export default api;
