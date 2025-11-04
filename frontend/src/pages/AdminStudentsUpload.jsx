import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { uploadStudents } from "../utils/api";

const AdminStudentsUpload = () => {
  const navigate = useNavigate();
  const token = useMemo(() => localStorage.getItem("token"), []);

  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      navigate("/login");
      return;
    }
    const u = JSON.parse(stored);
    if (u.role !== "admin") {
      navigate("/");
    }
  }, [navigate]);

  const onFileChange = (e) => {
    setError("");
    setResult(null);
    const f = e.target.files?.[0];
    if (!f) return setFile(null);
    const ok = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    if (!ok.includes(f.type) && !f.name.match(/\.(csv|xlsx?|xls)$/i)) {
      setError("Please select a CSV or Excel (.xls, .xlsx) file.");
      setFile(null);
      return;
    }
    setFile(f);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);
    if (!file) {
      setError("Please choose a CSV or Excel file to upload.");
      return;
    }
    try {
      setSubmitting(true);
      const { data } = await uploadStudents(file, token);
      setResult(data);
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          "Upload failed"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">Student Bulk Upload</h1>
      <p className="text-gray-600 mb-6">
        Upload a CSV or Excel file with the following columns: <b>Sno</b>,{" "}
        <b>Rollno</b>, <b>Name</b>, <b>Dept</b>, <b>College</b>, <b>Section</b>,{" "}
        <b>Semester</b>. This uploads the roster to the Student directory only.
        Accounts/credentials are not created here; students can register
        themselves using their details.
      </p>

      <div className="mb-4">
        <a
          href="/student-upload-template.csv"
          className="text-emerald-700 hover:underline"
          download
        >
          Download template CSV
        </a>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="bg-white rounded shadow p-4">
        <input
          type="file"
          accept=".csv,.xls,.xlsx"
          onChange={onFileChange}
          className="border rounded px-3 py-2 w-full"
        />
        <button
          type="submit"
          className="mt-4 bg-emerald-600 text-slate-900 font-semibold rounded px-4 py-2 disabled:opacity-60 hover:bg-emerald-500 transition-colors"
          disabled={submitting}
        >
          {submitting ? "Uploading…" : "Upload"}
        </button>
      </form>

      {result && (
        <div className="mt-6 bg-white rounded shadow p-4">
          <h2 className="text-xl font-semibold mb-2">Result</h2>
          <p className="text-gray-700">Total rows: {result.total}</p>
          <p className="text-green-700">Created: {result.created}</p>
          <p className="text-yellow-700">Skipped: {result.skipped}</p>
          {Array.isArray(result.errors) && result.errors.length > 0 && (
            <div className="mt-3">
              <h3 className="font-medium">Errors/Notes:</h3>
              <ul className="list-disc list-inside text-sm text-gray-700">
                {result.errors.map((e, idx) => (
                  <li key={idx}>
                    Row {e.row}: {e.error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminStudentsUpload;
