import axios from "axios";

const API = axios.create({ baseURL: "http://localhost:5000/api" });

// Auth
export const register = (formData) => API.post("/auth/register", formData);
export const login = (formData) => API.post("/auth/login", formData);

// Helpers
const authHeader = (token) => ({
  headers: { Authorization: `Bearer ${token}` },
});

// Admin
export const createFaculty = (data, token) =>
  API.post("/admin/faculty", data, authHeader(token));

export const listFaculty = (token) =>
  API.get("/admin/faculty", authHeader(token));
