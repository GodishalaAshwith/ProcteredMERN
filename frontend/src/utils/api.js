import axios from "axios";

// Prefer build-time environment variable VITE_API_BASE.
// Accept either a base with or without trailing /api and normalize it.
const normalizeBase = (base) => {
  if (!base) return null;
  const trimmed = base.replace(/\/$/, "");
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
};

const API_BASE =
  normalizeBase(import.meta.env?.VITE_API_BASE) ||
  // Fallback to existing hardcoded value if env is not set
  "https://procteredmern.onrender.com/api";

const API = axios.create({ baseURL: API_BASE });

// Auth
export const register = (formData) => API.post("/auth/register", formData);
export const login = (formData) => API.post("/auth/login", formData);
export const getCurrentUser = () => API.get("/auth/user", localAuthHeader());
export const updateProfile = (payload) =>
  API.put("/auth/profile", payload, localAuthHeader());
export const changePassword = (currentPassword, newPassword) =>
  API.post(
    "/auth/change-password",
    { currentPassword, newPassword },
    localAuthHeader()
  );

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

// Admin - Students bulk upload
export const uploadStudents = (file, token) => {
  const form = new FormData();
  form.append("file", file);
  return API.post("/admin/students/upload", form, {
    headers: {
      ...(authHeader(token).headers || {}),
      "Content-Type": "multipart/form-data",
    },
  });
};

// Admin - Users management
export const listUsers = (params, token) =>
  API.get("/admin/users", { ...authHeader(token), params });

export const updateUser = (id, payload, token) =>
  API.patch(`/admin/users/${id}`, payload, authHeader(token));

export const resetUserPassword = (id, toRollno = true, token) =>
  API.post(
    `/admin/users/${id}/reset-password`,
    { toRollno },
    authHeader(token)
  );

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

// Faculty - Retakes
export const grantRetake = (examId, studentId, count = 1) =>
  API.post(
    `/attempts/exam/${examId}/grant-retake`,
    { studentId, count },
    localAuthHeader()
  );
