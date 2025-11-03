import { useCallback, useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  getProctorEvents,
  listAttemptsForExam,
  grantRetake,
} from "../utils/api";

const FacultySubmissions = () => {
  const navigate = useNavigate();
  const { examId } = useParams();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [events, setEvents] = useState([]);
  const [selected, setSelected] = useState(null);

  // For Excel: Dates as Date objects to enable proper formatting in sheet
  const toExportRowsXLSX = useCallback(() => {
    return (rows || []).map((a, idx) => ({
      SNo: idx + 1,
      AttemptID: a._id,
      StudentName: a.student?.name || "",
      StudentEmail: a.student?.email || "",
      RollNo: a.student?.rollNo || "",
      Status: a.status,
      Score: typeof a.score === "number" ? a.score : "",
      Violations: a.violationsCount ?? 0,
      StartedAt: a.startedAt ? new Date(a.startedAt) : "",
      SubmittedAt: a.submittedAt ? new Date(a.submittedAt) : "",
    }));
  }, [rows]);

  // For CSV: Dates as ISO strings for readability
  const toExportRowsCSV = useCallback(() => {
    return (rows || []).map((a, idx) => ({
      SNo: idx + 1,
      AttemptID: a._id,
      StudentName: a.student?.name || "",
      StudentEmail: a.student?.email || "",
      RollNo: a.student?.rollNo || "",
      Status: a.status,
      Score: typeof a.score === "number" ? a.score : "",
      Violations: a.violationsCount ?? 0,
      StartedAt: a.startedAt ? new Date(a.startedAt).toISOString() : "",
      SubmittedAt: a.submittedAt ? new Date(a.submittedAt).toISOString() : "",
    }));
  }, [rows]);

  const fileStamp = () => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return (
      `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_` +
      `${pad(d.getHours())}${pad(d.getMinutes())}`
    );
  };

  const exportXLSX = () => {
    if (!rows?.length) return;
    const data = toExportRowsXLSX();
    const ws = XLSX.utils.json_to_sheet(data);
    // Set autofilter over the entire table
    if (ws["!ref"]) {
      const range = XLSX.utils.decode_range(ws["!ref"]);
      ws["!autofilter"] = { ref: XLSX.utils.encode_range(range) };
      // Compute column widths (wch) based on content
      const headers = Object.keys(data[0] || {});
      const cols = headers.map((h, cidx) => {
        const headerWidth = String(h).length;
        let max = headerWidth;
        for (let r = 0; r < data.length; r++) {
          const v = data[r][h];
          let len = 0;
          if (v == null) len = 0;
          else if (v instanceof Date) len = 19; // yyyy-mm-dd hh:mm:ss
          else len = String(v).length;
          if (len > max) max = len;
        }
        // Add padding, cap at a reasonable width
        const wch = Math.min(max + 2, 40);
        return { wch };
      });
      ws["!cols"] = cols;

      // Freeze header row if supported
      // Some readers ignore this metadata; harmless if not supported
      ws["!freeze"] = {
        xSplit: 0,
        ySplit: 1,
        topLeftCell: "A2",
        activePane: "bottomLeft",
      };

      // Apply date number format to date columns
      const dateHeaders = new Set(["StartedAt", "SubmittedAt"]);
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const headerCell = ws[XLSX.utils.encode_cell({ r: 0, c: C })];
        const headerText = headerCell?.v;
        if (dateHeaders.has(headerText)) {
          for (let R = 1; R <= range.e.r; ++R) {
            const addr = XLSX.utils.encode_cell({ r: R, c: C });
            const cell = ws[addr];
            if (cell && (cell.t === "n" || cell.t === "d")) {
              cell.z = "yyyy-mm-dd hh:mm:ss";
            }
          }
        }
      }
    }
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Submissions");
    XLSX.writeFile(wb, `exam_${examId}_submissions_${fileStamp()}.xlsx`, {
      bookType: "xlsx",
      compression: true,
    });
  };

  const exportCSV = () => {
    if (!rows?.length) return;
    const data = toExportRowsCSV();
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Submissions");
    XLSX.writeFile(wb, `exam_${examId}_submissions_${fileStamp()}.csv`, {
      bookType: "csv",
      FS: ",",
    });
  };

  const fetchAttempts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await listAttemptsForExam(examId);
      setRows(data || []);
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          "Failed to load attempts"
      );
    } finally {
      setLoading(false);
    }
  }, [examId]);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      navigate("/login");
      return;
    }
    const u = JSON.parse(stored);
    if (u.role !== "faculty") {
      navigate("/");
      return;
    }
    fetchAttempts();
  }, [navigate, fetchAttempts]);

  const viewEvents = async (attemptId) => {
    setSelected(attemptId);
    setEvents([]);
    try {
      const { data } = await getProctorEvents(attemptId);
      setEvents(data || []);
    } catch {
      setEvents([]);
    }
  };

  const onGrantRetake = async (studentId) => {
    const input = window.prompt("How many retakes to grant?", "1");
    if (input == null) return; // cancelled
    const count = Math.max(1, Number(input) || 1);
    try {
      const { data } = await grantRetake(examId, studentId, count);
      alert(
        `Retake granted. Remaining for student: ${data?.remaining ?? count}`
      );
      // No need to refetch attempts immediately; optional refresh
      // await fetchAttempts();
    } catch (e) {
      alert(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          "Failed to grant retake"
      );
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <div className="flex items-start sm:items-center justify-between gap-2 sm:gap-4 flex-col sm:flex-row">
        <h1 className="text-3xl font-bold">Submissions</h1>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            onClick={exportCSV}
            disabled={!rows.length}
            className="px-3 py-2 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            title="Download submissions as CSV"
          >
            Export CSV
          </button>
          <button
            onClick={exportXLSX}
            disabled={!rows.length}
            className="px-3 py-2 rounded-md bg-emerald-600 text-slate-900 font-semibold hover:bg-emerald-500 disabled:opacity-50"
            title="Download submissions as Excel (.xlsx)"
          >
            Export Excel
          </button>
          <Link
            to={`/faculty/exams/`}
            className="text-emerald-700 hover:underline ml-2"
          >
            Back to exam
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 px-4 py-2 rounded">{error}</div>
      )}

      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full table-auto min-w-max">
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
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-500">
                  No attempts yet.
                </td>
              </tr>
            ) : (
              rows.map((a) => {
                const studentName =
                  a.student?.name || a.student?.email || a.studentId;
                const studentMeta = a.student?.rollNo
                  ? ` (${a.student.rollNo})`
                  : "";
                return (
                  <tr key={a._id} className="border-t">
                    <td className="p-3 text-sm">{a._id}</td>
                    <td className="p-3 text-sm">
                      {studentName}
                      {studentMeta}
                    </td>
                    <td className="p-3">{a.status}</td>
                    <td className="p-3">{a.score}</td>
                    <td className="p-3">{a.violationsCount}</td>
                    <td className="p-3">
                      <button
                        className="text-emerald-700 hover:underline"
                        onClick={() => viewEvents(a._id)}
                      >
                        View events
                      </button>
                      {a.student?._id && (
                        <button
                          className="ml-3 text-emerald-700 hover:underline"
                          onClick={() => onGrantRetake(a.student._id)}
                          title="Allow this student to retake the test"
                        >
                          Grant retake
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="bg-white rounded shadow p-4">
          <div className="flex items-start sm:items-center justify-between mb-2 gap-2 flex-col sm:flex-row">
            <h2 className="text-xl font-semibold">
              Proctoring events for {selected}
            </h2>
            <button
              className="text-sm text-gray-600"
              onClick={() => {
                setSelected(null);
                setEvents([]);
              }}
            >
              Close
            </button>
          </div>
          {events.length === 0 ? (
            <div className="text-gray-500">No events.</div>
          ) : (
            <ul className="list-disc pl-5 space-y-1">
              {events.map((e) => {
                const friendly = {
                  "visibility-hidden": {
                    label: "Switched away from the test",
                    help: "Tab or app not visible",
                  },
                  "tab-blur": {
                    label: "Left the test window",
                    help: "Window lost focus or alt-tab",
                  },
                  "fullscreen-exit": {
                    label: "Exited fullscreen",
                    help: "Fullscreen turned off",
                  },
                  "return-timeout": {
                    label: "Return timeout",
                    help: "Took too long to come back",
                  },
                }[e.type] || { label: e.type, help: "" };
                return (
                  <li key={e._id} className="text-sm">
                    <span className="font-medium">{friendly.label}</span>
                    {friendly.help ? ` – ${friendly.help}` : ""} @{" "}
                    {new Date(e.createdAt).toLocaleString()}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default FacultySubmissions;
