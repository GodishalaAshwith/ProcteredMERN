import axios from "axios";

// Prefer environment-configured API base for deployments (Render, etc.)
// In local dev, default to http://localhost:5000/api
const DEFAULT_LOCAL_API = "http://localhost:5000/api";
const API_BASE = import.meta.env?.VITE_API_BASE || DEFAULT_LOCAL_API;
const API = axios.create({ baseURL: API_BASE });

// Auth
export const register = (formData) => API.post("/auth/register", formData);
export const login = (formData) => API.post("/auth/login", formData);
export const getCurrentUser = () => API.get("/auth/user", localAuthHeader());
export const updateProfile = (payload) =>
  API.put("/auth/profile", payload, localAuthHeader());

// Helpers
const authHeader = (token) => ({
  headers: { Authorization: `Bearer ${token}` },
});
const localAuthHeader = () => {
  const token = localStorage.getItem("token");
  return authHeader(token || "");
};

// Admin
export const createFaculty = (data, token) =>
  API.post("/admin/faculty", data, authHeader(token));

export const listFaculty = (token) =>
  API.get("/admin/faculty", authHeader(token));

// Faculty - Exams
export const listMyExams = () => API.get("/exams", localAuthHeader());
export const createExam = (payload) =>
  API.post("/exams", payload, localAuthHeader());
export const getExam = (id) => API.get(`/exams/${id}`, localAuthHeader());
export const updateExam = (id, payload) =>
  API.put(`/exams/${id}`, payload, localAuthHeader());
export const deleteExam = (id) => API.delete(`/exams/${id}`, localAuthHeader());

// Student - Available exams
export const listAvailableExams = () =>
  API.get("/exams/available", localAuthHeader());

// Attempts
export const startAttempt = (examId) =>
  API.post("/attempts/start", { examId }, localAuthHeader());
export const saveAttempt = (attemptId, answers) =>
  API.post("/attempts/save", { attemptId, answers }, localAuthHeader());
export const submitAttempt = (attemptId) =>
  API.post("/attempts/submit", { attemptId }, localAuthHeader());
export const getAttempt = (attemptId) =>
  API.get(`/attempts/${attemptId}`, localAuthHeader());
export const logProctorEvent = (attemptId, type, meta) =>
  API.post(`/attempts/${attemptId}/proctor`, { type, meta }, localAuthHeader());

// Faculty - Review attempts
export const listAttemptsForExam = (examId) =>
  API.get(`/attempts/exam/${examId}/attempts`, localAuthHeader());
export const getProctorEvents = (attemptId) =>
  API.get(`/attempts/${attemptId}/events`, localAuthHeader());
