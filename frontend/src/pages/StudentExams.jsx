import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listAvailableExams } from "../utils/api";

const StudentExams = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { navigate("/login"); return; }
    const u = JSON.parse(stored);
    setUser(u);
    if (u.role !== "student") { navigate("/"); return; }
    fetchExams();
  }, [navigate]);

  const fetchExams = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await listAvailableExams();
      setRows(data || []);
    } catch (e) {
      setError(e?.response?.data?.message || e?.response?.data?.error || "Failed to load exams");
    } finally {
      setLoading(false);
    }
  };

  const badge = (status) => {
    const map = {
      'not-started': 'bg-gray-200 text-gray-700',
      'in-progress': 'bg-yellow-100 text-yellow-800',
      'submitted': 'bg-green-100 text-green-800',
      'invalid': 'bg-red-100 text-red-800',
    };
    return map[status] || map['not-started'];
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <h1 className="text-3xl font-bold">Available Exams</h1>
      {user && (!user.year || !user.department || !user.section) && (
        <div className="bg-yellow-50 text-yellow-800 px-4 py-2 rounded">
          Your profile seems incomplete. Exams assigned by year/branch/section may not appear. Please
          <button className="underline ml-1" onClick={() => navigate('/student/profile')}>update your profile</button>.
        </div>
      )}
      {error && <div className="bg-red-100 text-red-700 px-4 py-2 rounded">{error}</div>}

      {loading && rows.length === 0 ? (
        <div className="text-gray-500">Loading...</div>
      ) : rows.length === 0 ? (
        <div className="text-gray-500">No exams are currently available.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rows.map((ex) => (
            <div key={ex._id} className="bg-white rounded shadow p-4 space-y-2">
              <div className="flex items-start justify-between">
                <h2 className="text-xl font-semibold">{ex.title}</h2>
                <span className={`text-xs px-2 py-1 rounded ${badge(ex.status)}`}>{ex.status}</span>
              </div>
              <p className="text-sm text-gray-600">{ex.description}</p>
              <div className="text-sm text-gray-700">
                <div>Duration: {ex.durationMins} mins</div>
                <div>
                  Window: {ex.window?.start ? new Date(ex.window.start).toLocaleString() : '-'} → {ex.window?.end ? new Date(ex.window.end).toLocaleString() : '-'}
                </div>
              </div>
              <div className="pt-2">
                <button
                  className="bg-indigo-600 text-white px-3 py-1 rounded"
                  onClick={() => navigate(`/attempt/${ex._id}`)}
                  disabled={ex.status === 'submitted'}
                  title={ex.status === 'submitted' ? 'Already submitted' : 'Open exam'}
                >
                  {ex.status === 'in-progress' ? 'Resume' : (ex.status === 'submitted' ? 'Submitted' : 'Start')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentExams;
