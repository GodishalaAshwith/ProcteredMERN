import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createFaculty, listFaculty } from "../utils/api";

const AdminFaculty = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const token = useMemo(() => localStorage.getItem("token"), []);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      navigate("/login");
      return;
    }
    const u = JSON.parse(stored);
    setUser(u);
    if (u.role !== "admin") {
      navigate("/");
      return;
    }
    fetchFaculty();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const fetchFaculty = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await listFaculty(token);
      setRows(data || []);
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          "Failed to fetch faculty"
      );
    } finally {
      setLoading(false);
    }
  };

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name || !form.email || !form.password) {
      setError("All fields are required");
      return;
    }
    try {
      setLoading(true);
      await createFaculty(form, token);
      setForm({ name: "", email: "", password: "" });
      await fetchFaculty();
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          "Failed to create faculty"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Faculty Management</h1>
      <p className="text-gray-600 mb-6">
        Create new faculty users and view the list.
      </p>

      {error && (
        <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4">
          {error}
        </div>
      )}

      <form
        onSubmit={onSubmit}
        className="bg-white rounded shadow p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={onChange}
          placeholder="Full name"
          className="border rounded px-3 py-2"
        />
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={onChange}
          placeholder="Email"
          className="border rounded px-3 py-2"
        />
        <input
          type="password"
          name="password"
          value={form.password}
          onChange={onChange}
          placeholder="Temp password"
          className="border rounded px-3 py-2"
        />
        <button
          type="submit"
          className="bg-indigo-600 text-white rounded px-4 py-2 disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Saving..." : "Create"}
        </button>
      </form>

      <div className="bg-white rounded shadow">
        <table className="w-full table-auto">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Role</th>
              <th className="text-left p-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {loading && rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-500">
                  No faculty yet.
                </td>
              </tr>
            ) : (
              rows.map((f) => (
                <tr key={f._id || f.id} className="border-t">
                  <td className="p-3">{f.name}</td>
                  <td className="p-3">{f.email}</td>
                  <td className="p-3">{f.role}</td>
                  <td className="p-3">
                    {new Date(f.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminFaculty;
