import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { deleteExam, listMyExams } from "../utils/api";

const FacultyExams = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      navigate("/login");
      return;
    }
    const u = JSON.parse(stored);
    setUser(u);
    if (u.role !== "faculty") {
      navigate("/");
      return;
    }
    fetchExams();
  }, [navigate]);

  const fetchExams = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await listMyExams();
      setRows(data || []);
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          "Failed to fetch exams"
      );
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (id) => {
    if (!window.confirm("Delete this exam? This cannot be undone.")) return;
    try {
      await deleteExam(id);
      await fetchExams();
    } catch (e) {
      alert(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          "Failed to delete exam"
      );
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">My Exams</h1>
        <Link
          to="/faculty/exams/new"
          className="bg-indigo-600 text-white px-4 py-2 rounded"
        >
          New Exam
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded shadow">
        <table className="w-full table-auto">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">Title</th>
              <th className="text-left p-3">Window</th>
              <th className="text-left p-3">Duration</th>
              <th className="text-left p-3">Actions</th>
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
                  No exams yet.
                </td>
              </tr>
            ) : (
              rows.map((ex) => (
                <tr key={ex._id} className="border-t">
                  <td className="p-3">{ex.title}</td>
                  <td className="p-3">
                    {ex.window?.start
                      ? new Date(ex.window.start).toLocaleString()
                      : "-"}{" "}
                    →{" "}
                    {ex.window?.end
                      ? new Date(ex.window.end).toLocaleString()
                      : "-"}
                  </td>
                  <td className="p-3">{ex.durationMins} mins</td>
                  <td className="p-3 flex gap-3">
                    <Link
                      to={`/faculty/exams/${ex._id}`}
                      className="text-indigo-600"
                    >
                      Edit
                    </Link>
                    <Link
                      to={`/faculty/exams/${ex._id}/attempts`}
                      className="text-indigo-600"
                    >
                      Submissions
                    </Link>
                    <button
                      onClick={() => onDelete(ex._id)}
                      className="text-red-600"
                    >
                      Delete
                    </button>
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

export default FacultyExams;
