import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, updateProfile } from "../utils/api";

const StudentProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    name: "",
    college: "",
    department: "",
    year: "",
    section: "",
  });

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { navigate("/login"); return; }
    const u = JSON.parse(stored);
    if (u.role !== "student") { navigate("/"); return; }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await getCurrentUser();
      setForm({
        name: data.name || "",
        college: data.college || "",
        department: data.department || "",
        year: data.year ?? "",
        section: data.section ?? "",
      });
    } catch (e) {
      setError(e?.response?.data?.message || e?.response?.data?.error || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const onSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const payload = {
        name: form.name,
        college: form.college,
        department: form.department,
        year: form.year === "" ? undefined : Number(form.year),
        section: form.section === "" ? undefined : Number(form.section),
      };
      const { data } = await updateProfile(payload);
      // sync localStorage user snapshot used by Navbar/guards
      const stored = localStorage.getItem("user");
      if (stored) {
        const u = JSON.parse(stored);
        const updated = { ...u, ...{
          name: data.name,
          college: data.college,
          department: data.department,
          year: data.year,
          section: data.section,
        }};
        localStorage.setItem("user", JSON.stringify(updated));
      }
      setSuccess("Profile updated");
    } catch (e) {
      setError(e?.response?.data?.message || e?.response?.data?.error || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const years = [1,2,3,4,5,6,7,8];
  const sections = [1,2,3,4,5];

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold">Student Profile</h1>
        <button onClick={() => navigate(-1)} className="text-indigo-600">Back</button>
      </div>

      {error && <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-3">{error}</div>}
      {success && <div className="bg-green-100 text-green-700 px-4 py-2 rounded mb-3">{success}</div>}

      <form onSubmit={onSave} className="bg-white rounded shadow p-4 space-y-4">
        {loading ? (
          <div className="text-gray-500">Loading...</div>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium">Name</label>
              <input
                className="border rounded w-full px-3 py-2"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">College</label>
              <input
                className="border rounded w-full px-3 py-2"
                value={form.college}
                onChange={(e) => setForm({ ...form, college: e.target.value })}
                placeholder="e.g. ABC Institute"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Department (Branch)</label>
              <input
                className="border rounded w-full px-3 py-2"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                placeholder="e.g. CSE, EEE"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">Year</label>
                <select
                  className="border rounded w-full px-3 py-2"
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: e.target.value })}
                >
                  <option value="">Select year</option>
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Section</label>
                <select
                  className="border rounded w-full px-3 py-2"
                  value={form.section}
                  onChange={(e) => setForm({ ...form, section: e.target.value })}
                >
                  <option value="">Select section</option>
                  {sections.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-2">
              <button disabled={saving} className="bg-indigo-600 text-white px-4 py-2 rounded disabled:opacity-60">
                {saving ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </>
        )}
      </form>

      <div className="text-sm text-gray-600 mt-3">
        Tip: Fill these fields so exams assigned to your year/branch/section show up under Exams.
      </div>
    </div>
  );
};

export default StudentProfile;
