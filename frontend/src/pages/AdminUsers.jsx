import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  listUsers,
  listStudents,
  updateUser,
  resetUserPassword,
} from "../utils/api";

const initialFilters = {
  role: "student",
  search: "",
  college: "",
  department: "",
  section: "",
  year: "",
  semester: "",
};

const AdminUsers = () => {
  const navigate = useNavigate();
  const token = useMemo(() => localStorage.getItem("token"), []);

  const [filters, setFilters] = useState(initialFilters);
  const [view, setView] = useState("accounts"); // 'accounts' | 'students'
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState(null); // row being edited
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      navigate("/login");
      return;
    }
    const u = JSON.parse(stored);
    if (u.role !== "admin") {
      navigate("/");
      return;
    }
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.role, view]);

  const fetchRows = async () => {
    setLoading(true);
    setError("");
    try {
      const params = { ...filters };
      // remove empty params
      Object.keys(params).forEach((k) => {
        if (params[k] === "") delete params[k];
      });
      let data;
      if (view === "students") {
        const res = await listStudents(params, token);
        data = res.data;
      } else {
        const res = await listUsers(params, token);
        data = res.data;
      }
      setRows(data.items || []);
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          "Failed to load users"
      );
    } finally {
      setLoading(false);
    }
  };

  const onSave = async () => {
    if (!editing) return;
    setSaving(true);
    setError("");
    try {
      const payload = { ...editing };
      const id = payload._id || payload.id;
      delete payload._id;
      delete payload.id;
      delete payload.createdAt;
      delete payload.role; // role changes not supported here
      const { data } = await updateUser(id, payload, token);
      // merge in table
      setRows((prev) =>
        prev.map((r) => (r._id === id || r.id === id ? data : r))
      );
      setEditing(null);
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          "Failed to save"
      );
    } finally {
      setSaving(false);
    }
  };

  const onResetPassword = async (row) => {
    try {
      const id = row._id || row.id;
      await resetUserPassword(id, true, token);
      alert("Password reset to roll number (or 'changeme123' if no rollno).");
    } catch (e) {
      alert(
        e?.response?.data?.message || e?.response?.data?.error || "Reset failed"
      );
    }
  };

  const fields = (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
      <div className="md:col-span-2 flex items-center gap-2">
        <button
          type="button"
          className={`px-3 py-2 rounded border ${
            view === "accounts"
              ? "bg-emerald-600 text-slate-900 border-emerald-700"
              : "bg-white text-slate-800 border-slate-300"
          }`}
          onClick={() => setView("accounts")}
        >
          Accounts
        </button>
        <button
          type="button"
          className={`px-3 py-2 rounded border ${
            view === "students"
              ? "bg-emerald-600 text-slate-900 border-emerald-700"
              : "bg-white text-slate-800 border-slate-300"
          }`}
          onClick={() => setView("students")}
        >
          Students
        </button>
      </div>
      <select
        value={filters.role}
        onChange={(e) => setFilters({ ...filters, role: e.target.value })}
        className="border rounded px-3 py-2"
      >
        <option value="student">Students</option>
        <option value="faculty">Faculty</option>
      </select>
      <input
        type="text"
        placeholder="Search name/email/rollno"
        value={filters.search}
        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        className="border rounded px-3 py-2"
      />
      <input
        type="text"
        placeholder="College"
        value={filters.college}
        onChange={(e) => setFilters({ ...filters, college: e.target.value })}
        className="border rounded px-3 py-2"
      />
      <input
        type="text"
        placeholder="Department"
        value={filters.department}
        onChange={(e) => setFilters({ ...filters, department: e.target.value })}
        className="border rounded px-3 py-2"
      />
      <input
        type="number"
        min="1"
        max="5"
        placeholder="Section"
        value={filters.section}
        onChange={(e) => setFilters({ ...filters, section: e.target.value })}
        className="border rounded px-3 py-2"
      />
      <input
        type="number"
        min="1"
        max="8"
        placeholder="Year"
        value={filters.year}
        onChange={(e) => setFilters({ ...filters, year: e.target.value })}
        className="border rounded px-3 py-2"
      />
      <input
        type="number"
        min="1"
        max="16"
        placeholder="Semester"
        value={filters.semester}
        onChange={(e) => setFilters({ ...filters, semester: e.target.value })}
        className="border rounded px-3 py-2"
      />
      <button
        onClick={fetchRows}
        className="md:col-span-2 bg-emerald-600 text-slate-900 font-semibold rounded px-4 py-2 hover:bg-emerald-500"
      >
        Apply Filters
      </button>
      <button
        onClick={() => {
          setFilters(initialFilters);
          setTimeout(fetchRows, 0);
        }}
        className="bg-slate-200 text-slate-900 rounded px-4 py-2"
      >
        Clear
      </button>
    </div>
  );

  const renderEditModal = () => {
    if (!editing) return null;
    if (view === "students") return null; // no edit modal for roster entries yet
    const isStudent = editing.role === "student";
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
        <div className="bg-white rounded shadow max-w-xl w-full p-4">
          <h2 className="text-xl font-semibold mb-3">Edit {editing.name}</h2>
          {error && (
            <div className="bg-red-100 text-red-700 px-3 py-2 rounded mb-3">
              {error}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              className="border rounded px-3 py-2"
              placeholder="Name"
              value={editing.name || ""}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
            />
            <input
              className="border rounded px-3 py-2"
              placeholder="Email"
              type="email"
              value={editing.email || ""}
              onChange={(e) =>
                setEditing({ ...editing, email: e.target.value })
              }
            />
            {isStudent && (
              <input
                className="border rounded px-3 py-2"
                placeholder="Roll Number"
                value={editing.rollno || ""}
                onChange={(e) =>
                  setEditing({ ...editing, rollno: e.target.value })
                }
              />
            )}
            <input
              className="border rounded px-3 py-2"
              placeholder="College"
              value={editing.college || ""}
              onChange={(e) =>
                setEditing({ ...editing, college: e.target.value })
              }
            />
            <input
              className="border rounded px-3 py-2"
              placeholder="Department"
              value={editing.department || ""}
              onChange={(e) =>
                setEditing({ ...editing, department: e.target.value })
              }
            />
            {isStudent && (
              <input
                className="border rounded px-3 py-2"
                placeholder="Section (1-5)"
                type="number"
                min={1}
                max={5}
                value={editing.section ?? ""}
                onChange={(e) =>
                  setEditing({ ...editing, section: e.target.value })
                }
              />
            )}
            {isStudent && (
              <input
                className="border rounded px-3 py-2"
                placeholder="Year (1-8)"
                type="number"
                min={1}
                max={8}
                value={editing.year ?? ""}
                onChange={(e) =>
                  setEditing({ ...editing, year: e.target.value })
                }
              />
            )}
            {isStudent && (
              <input
                className="border rounded px-3 py-2"
                placeholder="Semester (1-16)"
                type="number"
                min={1}
                max={16}
                value={editing.semester ?? ""}
                onChange={(e) =>
                  setEditing({ ...editing, semester: e.target.value })
                }
              />
            )}
          </div>
          <div className="mt-4 flex gap-2 justify-end">
            <button
              className="px-4 py-2 rounded bg-slate-200"
              onClick={() => setEditing(null)}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 rounded bg-rose-200"
              onClick={() => onResetPassword(editing)}
            >
              Reset Password
            </button>
            <button
              className="px-4 py-2 rounded bg-emerald-600 text-slate-900 font-semibold disabled:opacity-60"
              disabled={saving}
              onClick={onSave}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">Admin Directory</h1>
      <p className="text-gray-600 mb-4">
        {view === "accounts"
          ? "View and manage user accounts (students/faculty)."
          : "View uploaded student roster (non-auth records)."}
      </p>

      <div className="bg-white rounded shadow p-4 mb-4">{fields}</div>

      {loading ? (
        <div className="p-6 text-gray-500">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="p-6 text-gray-500">No records found.</div>
      ) : (
        <div className="bg-white rounded shadow overflow-auto">
          <table className="w-full table-auto">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Email</th>
                {(view === "accounts" && filters.role === "student") ||
                view === "students" ? (
                  <th className="text-left p-3">Roll No</th>
                ) : null}
                <th className="text-left p-3">Dept</th>
                <th className="text-left p-3">College</th>
                {(view === "accounts" && filters.role === "student") ||
                view === "students" ? (
                  <th className="text-left p-3">Sec</th>
                ) : null}
                {(view === "accounts" && filters.role === "student") ||
                view === "students" ? (
                  <th className="text-left p-3">Year</th>
                ) : null}
                {(view === "accounts" && filters.role === "student") ||
                view === "students" ? (
                  <th className="text-left p-3">Sem</th>
                ) : null}
                {view === "accounts" && (
                  <th className="text-left p-3">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const isRoster = view === "students";
                return (
                  <tr key={r._id || r.id} className="border-t">
                    <td className="p-3">{r.name}</td>
                    <td className="p-3">{r.email}</td>
                    {((view === "accounts" && filters.role === "student") ||
                      view === "students") && (
                      <td className="p-3">{r.rollno}</td>
                    )}
                    <td className="p-3">{r.department || "-"}</td>
                    <td className="p-3">{r.college || "-"}</td>
                    {((view === "accounts" && filters.role === "student") ||
                      view === "students") && (
                      <td className="p-3">{r.section ?? "-"}</td>
                    )}
                    {((view === "accounts" && filters.role === "student") ||
                      view === "students") && (
                      <td className="p-3">{r.year ?? "-"}</td>
                    )}
                    {((view === "accounts" && filters.role === "student") ||
                      view === "students") && (
                      <td className="p-3">{r.semester ?? "-"}</td>
                    )}
                    {view === "accounts" && (
                      <td className="p-3">
                        <button
                          className="px-3 py-1 rounded bg-slate-200"
                          onClick={() => setEditing(r)}
                        >
                          Edit
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {renderEditModal()}
    </div>
  );
};

export default AdminUsers;
