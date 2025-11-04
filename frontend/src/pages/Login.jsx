import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";
import config from "../config/config";

const Login = () => {
  const navigate = useNavigate();

  useEffect(() => {
    AOS.init({ duration: 1000, once: false, mirror: true });

    // If already logged in, redirect to dashboard
    const loggedInUser = localStorage.getItem("user");
    if (loggedInUser) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [mode, setMode] = useState("student"); // "student" | "user"
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setError("");
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const email = formData.email.trim();
    const password = formData.password;
    // Allow either a valid email or a roll number (non-empty string without spaces)
    const emailOk = /.+@.+\..+/.test(email);
    const rollOk = /^[^\s@]+$/.test(email);
    if (!email || !(emailOk || rollOk) || !password) {
      setError("Enter your email or roll number and password.");
      return;
    }

    setLoading(true);
    try {
      const endpoint =
        mode === "student" ? "/api/auth/login-student" : "/api/auth/login-user";
      const response = await fetch(config.getApiUrl(endpoint), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        // Notify app components and navigate without full reload
        window.dispatchEvent(new Event("user-updated"));
        navigate("/dashboard");
      } else {
        setError(data.message || "Invalid credentials. Please try again.");
      }
    } catch (err) {
      console.error("Login Error:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 font-sans flex items-center justify-center min-h-[70vh] py-10">
      <div
        className="bg-white p-10 rounded-xl shadow-xl max-w-md w-full text-center border border-slate-200"
        data-aos="fade-up"
      >
        <h2 className="text-3xl sm:text-4xl font-bold text-emerald-700 mb-3">
          Login
        </h2>
        <div className="flex mb-6 rounded-lg overflow-hidden border border-slate-200">
          <button
            type="button"
            onClick={() => setMode("student")}
            className={`flex-1 py-2 text-sm font-medium ${
              mode === "student"
                ? "bg-emerald-600 text-slate-900"
                : "bg-white text-slate-700"
            }`}
          >
            Student Login
          </button>
          <button
            type="button"
            onClick={() => setMode("user")}
            className={`flex-1 py-2 text-sm font-medium ${
              mode === "user"
                ? "bg-emerald-600 text-slate-900"
                : "bg-white text-slate-700"
            }`}
          >
            Faculty Login
          </button>
        </div>
        {error && (
          <div
            className="bg-red-50 border border-red-200 text-red-700 text-left px-3 py-2 rounded mb-4"
            role="alert"
            aria-live="polite"
          >
            {error}
          </div>
        )}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col space-y-4 text-left"
        >
          <input
            type="text"
            name="email"
            placeholder={
              mode === "student" ? "Email or Roll Number" : "Email or Username"
            }
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            required
          />
          <div>
            <label className="sr-only" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-12"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 px-3 text-slate-600 hover:text-slate-800"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5"
                  >
                    <path d="M3.53 2.47a.75.75 0 0 0-1.06 1.06l18 18a.75.75 0 1 0 1.06-1.06l-3.088-3.088A11.68 11.68 0 0 0 21.75 12C20.872 9.33 17.4 5.25 12 5.25c-1.545 0-2.94.351-4.18.92L3.53 2.47ZM12 7.5c4.212 0 7.2 3.333 8.02 4.5-.258.373-.644.886-1.146 1.46l-2.25-2.25A4.5 4.5 0 0 0 9.79 8.54l-1.71-1.71C9.1 6.97 10.48 6.75 12 6.75Zm0 9.75a4.5 4.5 0 0 0 4.038-2.5l-1.597-1.597A2.999 2.999 0 0 1 12 15a2.999 2.999 0 0 1-2.44-1.303l-1.597-1.597A4.5 4.5 0 0 0 12 17.25Zm-8.02-3.75c.334.482.83 1.146 1.479 1.848l-1.06 1.06C2.658 15.32 2.13 14.608 2.25 12c.878-2.67 4.35-6.75 9.75-6.75.847 0 1.66.094 2.43.269l-1.31 1.31c-.356-.045-.72-.069-1.12-.069-4.212 0-7.2 3.333-8.02 4.5Z" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5"
                  >
                    <path d="M12 5.25c-5.4 0-8.872 4.08-9.75 6.75.878 2.67 4.35 6.75 9.75 6.75s8.872-4.08 9.75-6.75c-.878-2.67-4.35-6.75-9.75-6.75Zm0 10.5a3.75 3.75 0 1 1 0-7.5 3.75 3.75 0 0 1 0 7.5Z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <button
            type="submit"
            className={`w-full bg-emerald-600 text-slate-900 py-3 rounded-md font-semibold transition-colors ${
              loading ? "opacity-60 cursor-not-allowed" : "hover:bg-emerald-500"
            }`}
            disabled={loading}
          >
            {loading ? "Signing in…" : "Login"}
          </button>
        </form>
        <p className="mt-4 text-slate-600">
          Don&apos;t have an account?{" "}
          <a href="/register" className="text-emerald-700 hover:underline">
            Sign Up
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;
