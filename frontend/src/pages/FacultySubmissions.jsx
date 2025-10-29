import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getProctorEvents, listAttemptsForExam } from "../utils/api";

const FacultySubmissions = () => {
  const navigate = useNavigate();
  const { examId } = useParams();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [events, setEvents] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { navigate("/login"); return; }
    const u = JSON.parse(stored);
    if (u.role !== "faculty") { navigate("/"); return; }
    fetchAttempts();
  }, [examId]);

  const fetchAttempts = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await listAttemptsForExam(examId);
      setRows(data || []);
    } catch (e) {
      setError(e?.response?.data?.message || e?.response?.data?.error || "Failed to load attempts");
    } finally {
      setLoading(false);
    }
  };

  const viewEvents = async (attemptId) => {
    setSelected(attemptId);
    setEvents([]);
    try {
      const { data } = await getProctorEvents(attemptId);
      setEvents(data || []);
    } catch (e) {
      setEvents([]);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Submissions</h1>
        <Link to={`/faculty/exams/${examId}`} className="text-indigo-600">Back to exam</Link>
      </div>

      {error && <div className="bg-red-100 text-red-700 px-4 py-2 rounded">{error}</div>}

      <div className="bg-white rounded shadow">
        <table className="w-full table-auto">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">Attempt</th>
              <th className="text-left p-3">Student</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Score</th>
              <th className="text-left p-3">Violations</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && rows.length === 0 ? (
              <tr><td colSpan={6} className="p-4 text-center text-gray-500">Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="p-4 text-center text-gray-500">No attempts yet.</td></tr>
            ) : (
              rows.map((a) => (
                <tr key={a._id} className="border-t">
                  <td className="p-3 text-sm">{a._id}</td>
                  <td className="p-3 text-sm">{a.studentId}</td>
                  <td className="p-3">{a.status}</td>
                  <td className="p-3">{a.score}</td>
                  <td className="p-3">{a.violationsCount}</td>
                  <td className="p-3">
                    <button className="text-indigo-600" onClick={() => viewEvents(a._id)}>View events</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="bg-white rounded shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-semibold">Proctoring events for {selected}</h2>
            <button className="text-sm text-gray-600" onClick={()=>{ setSelected(null); setEvents([]); }}>Close</button>
          </div>
          {events.length === 0 ? (
            <div className="text-gray-500">No events.</div>
          ) : (
            <ul className="list-disc pl-5 space-y-1">
              {events.map((e) => (
                <li key={e._id} className="text-sm">
                  <span className="font-medium">{e.type}</span> @ {new Date(e.createdAt).toLocaleString()} {e.meta ? `- ${JSON.stringify(e.meta)}` : ''}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default FacultySubmissions;
