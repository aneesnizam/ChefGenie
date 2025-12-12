import axios from "axios";

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
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

const axiosInstance = axios.create({
  baseURL,
});

axiosInstance.interceptors.request.use((req) => {
  const tokens = getStoredTokens();
  if (tokens?.access) {
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
