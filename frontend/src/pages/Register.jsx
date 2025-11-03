import { useEffect, useMemo, useState } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

const Register = () => {
  useEffect(() => {
    AOS.init({ duration: 1000, once: true, mirror: false });
  }, []);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Password validation rules
  const rules = useMemo(
    () => ({
      length: (v) => v.length >= 8,
      upper: (v) => /[A-Z]/.test(v),
      lower: (v) => /[a-z]/.test(v),
      number: (v) => /\d/.test(v),
      special: (v) => /[^A-Za-z0-9]/.test(v),
    }),
    []
  );

  const pwdChecks = useMemo(() => {
    const v = formData.password || "";
    return {
      length: rules.length(v),
      upper: rules.upper(v),
      lower: rules.lower(v),
      number: rules.number(v),
      special: rules.special(v),
    };
  }, [formData.password, rules]);

  const strength = useMemo(() => {
    const count = Object.values(pwdChecks).filter(Boolean).length;
    if (!formData.password)
      return { label: "", level: 0, color: "bg-slate-200" };
    if (count <= 2) return { label: "Weak", level: 1, color: "bg-red-500" };
    if (count === 3 || count === 4)
      return { label: "Medium", level: 2, color: "bg-amber-500" };
    return { label: "Strong", level: 3, color: "bg-emerald-600" };
  }, [pwdChecks, formData.password]);

  const handleChange = (e) => {
    setError("");
    setSuccess("");
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const name = formData.name.trim();
    const email = formData.email.trim();
    const password = formData.password;

    if (!name || !email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    if (
      !pwdChecks.length ||
      !pwdChecks.upper ||
      !pwdChecks.lower ||
      !pwdChecks.number ||
      !pwdChecks.special
    ) {
      setError("Password does not meet the minimum requirements.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess("Registration successful! Redirecting to login...");
        setTimeout(() => {
          window.location.href = "/login";
        }, 800);
      } else {
        setError(data.message || "Registration failed. Please try again.");
      }
    } catch (err) {
      console.error("Registration Error:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 font-sans flex items-center justify-center min-h-screen p-6">
      <div
        className="bg-white p-10 rounded-2xl shadow-xl max-w-md w-full text-center border border-slate-200"
        data-aos="fade-up"
      >
        <h2 className="text-3xl sm:text-4xl font-bold text-emerald-700 mb-3">
          Create Account
        </h2>
        <p className="text-slate-600 mb-6">
          Join ProcTesting to deliver or take secure online exams.
        </p>
        {error && (
          <div
            className="bg-red-50 border border-red-200 text-red-700 text-left px-3 py-2 rounded mb-4"
            role="alert"
            aria-live="polite"
          >
            {error}
          </div>
        )}
        {success && (
          <div
            className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-left px-3 py-2 rounded mb-4"
            role="status"
            aria-live="polite"
          >
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email Address"
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
                autoComplete="new-password"
                aria-describedby="password-help"
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

            <div className="mt-2" id="password-help">
              <div className="flex gap-1 h-1.5">
                <div
                  className={`flex-1 rounded ${
                    strength.level >= 1 ? strength.color : "bg-slate-200"
                  }`}
                />
                <div
                  className={`flex-1 rounded ${
                    strength.level >= 2 ? strength.color : "bg-slate-200"
                  }`}
                />
                <div
                  className={`flex-1 rounded ${
                    strength.level >= 3 ? strength.color : "bg-slate-200"
                  }`}
                />
              </div>
              {strength.label && (
                <div className="text-xs text-slate-600 mt-1">
                  Strength: {strength.label}
                </div>
              )}
            </div>

            <ul className="mt-3 space-y-1 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <span
                  className={`w-4 h-4 inline-flex items-center justify-center rounded-full ${
                    pwdChecks.length
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  ✓
                </span>
                At least 8 characters
              </li>
              <li className="flex items-center gap-2">
                <span
                  className={`w-4 h-4 inline-flex items-center justify-center rounded-full ${
                    pwdChecks.upper
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  ✓
                </span>
                One uppercase (A-Z)
              </li>
              <li className="flex items-center gap-2">
                <span
                  className={`w-4 h-4 inline-flex items-center justify-center rounded-full ${
                    pwdChecks.lower
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  ✓
                </span>
                One lowercase (a-z)
              </li>
              <li className="flex items-center gap-2">
                <span
                  className={`w-4 h-4 inline-flex items-center justify-center rounded-full ${
                    pwdChecks.number
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  ✓
                </span>
                One number (0-9)
              </li>
              <li className="flex items-center gap-2">
                <span
                  className={`w-4 h-4 inline-flex items-center justify-center rounded-full ${
                    pwdChecks.special
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  ✓
                </span>
                One special character (!@#$…)
              </li>
            </ul>
          </div>
          <div>
            <label className="sr-only" htmlFor="confirm-password">
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirm-password"
                type={showConfirm ? "text" : "password"}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => {
                  setError("");
                  setConfirmPassword(e.target.value);
                }}
                className="w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-12"
                required
                autoComplete="new-password"
                aria-invalid={Boolean(
                  confirmPassword && confirmPassword !== formData.password
                )}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute inset-y-0 right-0 px-3 text-slate-600 hover:text-slate-800"
                aria-label={
                  showConfirm
                    ? "Hide confirm password"
                    : "Show confirm password"
                }
              >
                {showConfirm ? (
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
            {confirmPassword && confirmPassword !== formData.password && (
              <div className="text-xs text-red-600 mt-1">
                Passwords do not match.
              </div>
            )}
          </div>

          <button
            type="submit"
            className={`w-full bg-emerald-600 text-slate-900 py-3 rounded-md font-semibold transition-colors ${
              loading ||
              !formData.name ||
              !formData.email ||
              !formData.password ||
              !pwdChecks.length ||
              !pwdChecks.upper ||
              !pwdChecks.lower ||
              !pwdChecks.number ||
              !pwdChecks.special ||
              confirmPassword !== formData.password
                ? "opacity-60 cursor-not-allowed"
                : "hover:bg-emerald-500"
            }`}
            disabled={
              loading ||
              !formData.name ||
              !formData.email ||
              !formData.password ||
              !pwdChecks.length ||
              !pwdChecks.upper ||
              !pwdChecks.lower ||
              !pwdChecks.number ||
              !pwdChecks.special ||
              confirmPassword !== formData.password
            }
          >
            {loading ? "Creating account…" : "Sign Up"}
          </button>
        </form>

        <p className="mt-4 text-slate-600">
          Already have an account?{" "}
          <a href="/login" className="text-emerald-700 hover:underline">
            Login
          </a>
        </p>
      </div>
    </div>
  );
};

export default Register;
