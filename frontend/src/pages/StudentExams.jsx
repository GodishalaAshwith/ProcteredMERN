import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listAvailableExams } from "../utils/api";

const StudentExams = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      navigate("/login");
      return;
    }
    const u = JSON.parse(stored);
    setUser(u);
    if (u.role !== "student") {
      navigate("/");
      return;
    }
    fetchExams();
  }, [navigate]);

  // Update a ticking clock for countdowns
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const fetchExams = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await listAvailableExams();
      setRows(data || []);
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          "Failed to load exams"
      );
    } finally {
      setLoading(false);
    }
  };

  const badge = (status) => {
    const map = {
      "not-started": "bg-gray-200 text-gray-700",
      "in-progress": "bg-yellow-100 text-yellow-800",
      submitted: "bg-green-100 text-green-800",
      invalid: "bg-red-100 text-red-800",
    };
    return map[status] || map["not-started"];
  };

  const formatDuration = (ms) => {
    if (ms == null) return "";
    if (ms <= 0) return "0s";
    const total = Math.floor(ms / 1000);
    const d = Math.floor(total / 86400);
    const h = Math.floor((total % 86400) / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const parts = [];
    if (d) parts.push(`${d}d`);
    if (h || d) parts.push(`${h}h`);
    if (m || h || d) parts.push(`${m}m`);
    parts.push(`${s}s`);
    return parts.join(" ");
  };

  const computed = useMemo(() => {
    const nowDate = new Date(now);
    const items = (rows || []).map((ex) => {
      const start = ex.window?.start ? new Date(ex.window.start) : null;
      const end = ex.window?.end ? new Date(ex.window.end) : null;
      const isUpcoming = !!(start && nowDate < start);
      const isActive = !!(start && end && start <= nowDate && nowDate <= end);
      const startsInMs = start ? start.getTime() - now : null;
      return {
        ...ex,
        _isUpcoming: isUpcoming,
        _isActive: isActive,
        _startsInMs: startsInMs,
      };
    });
    // active first, then upcoming, by start time asc
    return items.sort((a, b) => {
      if (a._isActive !== b._isActive) return a._isActive ? -1 : 1;
      const aStart = a.window?.start ? new Date(a.window.start).getTime() : 0;
      const bStart = b.window?.start ? new Date(b.window.start).getTime() : 0;
      return aStart - bStart;
    });
  }, [rows, now]);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <h1 className="text-3xl font-bold">Available Exams</h1>
      {user && (!user.year || !user.department || !user.section) && (
        <div className="bg-yellow-50 text-yellow-800 px-4 py-2 rounded">
          Your profile seems incomplete. Exams assigned by year/branch/section
          may not appear. Please
          <button
            className="underline ml-1"
            onClick={() => navigate("/student/profile")}
          >
            update your profile
          </button>
          .
        </div>
      )}
      {error && (
        <div className="bg-red-100 text-red-700 px-4 py-2 rounded">{error}</div>
      )}

      {loading && rows.length === 0 ? (
        <div className="text-gray-500">Loading...</div>
      ) : rows.length === 0 ? (
        <div className="text-gray-500">No exams are currently available.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {computed.map((ex) => (
            <div key={ex._id} className="bg-white rounded shadow p-4 space-y-2">
              <div className="flex items-start justify-between">
                <h2 className="text-xl font-semibold">{ex.title}</h2>
                <div className="flex flex-col items-end gap-1">
                  {ex._isUpcoming ? (
                    <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
                      Upcoming
                    </span>
                  ) : (
                    <span
                      className={`text-xs px-2 py-1 rounded ${badge(
                        ex.status
                      )}`}
                    >
                      {ex.status}
                    </span>
                  )}
                  {ex._isUpcoming && typeof ex._startsInMs === "number" && (
                    <span className="text-[11px] text-blue-700">
                      Starts in {formatDuration(ex._startsInMs)}
                    </span>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-600">{ex.description}</p>
              <div className="text-sm text-gray-700">
                <div>Duration: {ex.durationMins} mins</div>
                <div>
                  Window:{" "}
                  {ex.window?.start
                    ? new Date(ex.window.start).toLocaleString()
                    : "-"}{" "}
                  →{" "}
                  {ex.window?.end
                    ? new Date(ex.window.end).toLocaleString()
                    : "-"}
                </div>
              </div>
              <div className="pt-2">
                <button
                  className="bg-emerald-600 text-slate-900 font-semibold px-3 py-1 rounded hover:bg-emerald-500 transition-colors disabled:bg-gray-200 disabled:text-gray-500"
                  onClick={() => navigate(`/attempt/${ex._id}`)}
                  disabled={ex.status === "submitted" || ex._isUpcoming}
                  title={
                    ex.status === "submitted"
                      ? "Already submitted"
                      : ex._isUpcoming
                      ? "Exam hasn't started yet"
                      : "Open exam"
                  }
                >
                  {ex._isUpcoming
                    ? "Starts soon"
                    : ex.status === "in-progress"
                    ? "Resume"
                    : ex.status === "submitted"
                    ? "Submitted"
                    : "Start"}
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
