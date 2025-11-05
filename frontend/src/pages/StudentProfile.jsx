import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser } from "../utils/api";

const StudentProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      navigate("/login");
      return;
    }
    const u = JSON.parse(stored);
    if (u.role !== "student") {
      navigate("/");
      return;
    }

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await getCurrentUser();
        setProfile(data);
      } catch (e) {
        setError(
          e?.response?.data?.message ||
            e?.response?.data?.error ||
            "Failed to load profile"
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [navigate]);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-start sm:items-center justify-between gap-2 flex-col sm:flex-row mb-4">
        <h1 className="text-3xl font-bold">Student Profile</h1>
        <button
          onClick={() => navigate(-1)}
          className="text-emerald-700 hover:underline"
        >
          Back
        </button>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-3">
          {error}
        </div>
      )}

      <div className="bg-white rounded shadow p-4">
        {loading || !profile ? (
          <div className="text-gray-500">Loading...</div>
        ) : (
          <div className="space-y-3">
            <Field label="Roll No" value={profile.rollno || "-"} />
            <Field label="Name" value={profile.name || "-"} />
            <Field label="Email" value={profile.email || "-"} />
            <Field label="College" value={profile.college || "-"} />
            <Field label="Department" value={profile.department || "-"} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Field label="Year" value={profile.year ?? "-"} />
              <Field label="Section" value={profile.section ?? "-"} />
              <Field label="Semester" value={profile.semester ?? "-"} />
            </div>
            <div className="text-sm text-gray-600 pt-1">
              These details come from the college roster. Contact your admin to
              correct any mistakes.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Field = ({ label, value }) => (
  <div>
    <div className="text-xs text-gray-500 mb-1">{label}</div>
    <div className="px-3 py-2 border rounded bg-gray-50 text-gray-800">
      {String(value)}
    </div>
  </div>
);

export default StudentProfile;
