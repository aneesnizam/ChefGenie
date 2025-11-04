import axios from "axios";
import { jwtDecode } from "jwt-decode";


const baseURL = "http://127.0.0.1:8000";

let tokens = localStorage.getItem("tokens")
  ? JSON.parse(localStorage.getItem("tokens"))
  : null;

const axiosInstance = axios.create({
  baseURL: baseURL,
  headers: tokens ? { Authorization: `Bearer ${tokens.access}` } : {},
});

axiosInstance.interceptors.request.use(async (req) => {
  const publicRoutes = [
    "/api/recipes/",
    "/api/categories/",
    "/api/public-data/",
  ];

  if (publicRoutes.some((route) => req.url.includes(route))) {
    return req;
  }

  let tokens = localStorage.getItem("tokens")
    ? JSON.parse(localStorage.getItem("tokens"))
    : null;

  if (!tokens) {
    return req;
  }
  const user = jwtDecode(tokens.access);
  const isExpired = Date.now() >= user.exp * 1000;

  if (!isExpired) {
    req.headers.Authorization = `Bearer ${tokens.access}`;
    return req;
  }

  try {
    const response = await axios.post(`${baseURL}/token/refresh/`, {
      refresh: tokens.refresh,
    });
    localStorage.setItem("tokens", JSON.stringify(response.data));
    req.headers.Authorization = `Bearer ${response.data.access}`;
    return req;
  } catch (err) {
    console.log("Refresh token is expired, logging out.");
    localStorage.removeItem("tokens");
    window.location.href = "/login";
    return Promise.reject(err);
  }
});
export default axiosInstance;
