import axios from "axios";
import { jwtDecode } from "jwt-decode";

const baseURL = "http://127.0.0.1:8000";

const getStoredTokens = () => {
  try {
    const value = localStorage.getItem("tokens");
    return value ? JSON.parse(value) : null;
  } catch (err) {
    console.error("Failed to parse stored tokens", err);
    return null;
  }
};

const setStoredTokens = (tokens) => {
  localStorage.setItem("tokens", JSON.stringify(tokens));
};

const clearAuthState = () => {
  localStorage.removeItem("tokens");
  window.location.href = "/login";
};

// Check if token is expired or will expire soon (within 5 minutes)
const isTokenExpiredOrExpiringSoon = (token) => {
  if (!token) return true;
  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    const expirationTime = decoded.exp;
    // Refresh if token expires within 5 minutes (300 seconds)
    return expirationTime - currentTime < 300;
  } catch (error) {
    console.error("Error decoding token:", error);
    return true;
  }
};

let refreshPromise = null;
const requestTokenRefresh = (refreshToken) => {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${baseURL}/auth/token/refresh`, { refresh: refreshToken })
      .then((response) => {
        console.log("✅ Token refreshed");
        setStoredTokens(response.data);
        return response.data;
      })
      .catch((error) => {
        console.error("Token refresh failed:", error);
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

const axiosInstance = axios.create({
  baseURL,
});

axiosInstance.interceptors.request.use(async (req) => {
  const tokens = getStoredTokens();

  if (tokens?.access) {
    // Proactively refresh token if it's expired or expiring soon
    if (isTokenExpiredOrExpiringSoon(tokens.access) && tokens.refresh) {
      try {
        const newTokens = await requestTokenRefresh(tokens.refresh);
        req.headers.Authorization = `Bearer ${newTokens.access}`;
        return req;
      } catch (error) {
        // If refresh fails, clear auth and let the request fail
        clearAuthState();
        return Promise.reject(error);
      }
    }

    req.headers.Authorization = `Bearer ${tokens.access}`;
  }

  return req;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isUnauthorized =
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry;

    if (!isUnauthorized) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    const tokens = getStoredTokens();

    if (!tokens?.refresh) {
      clearAuthState();
      return Promise.reject(error);
    }

    try {
      const newTokens = await requestTokenRefresh(tokens.refresh);
      originalRequest.headers.Authorization = `Bearer ${newTokens.access}`;
      return axiosInstance(originalRequest);
    } catch (refreshError) {
      console.log("Refresh token request failed", refreshError);
      clearAuthState();
      return Promise.reject(refreshError);
    }
  }
);

export default axiosInstance;
