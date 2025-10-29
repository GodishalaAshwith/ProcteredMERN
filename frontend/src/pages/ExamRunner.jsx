import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { logProctorEvent, saveAttempt, startAttempt, submitAttempt } from "../utils/api";

const VIOLATION_LIMIT = 3;
const RETURN_TIMEOUT_SECONDS = 10;
const AUTOSAVE_MS = 3000;

const ExamRunner = () => {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [state, setState] = useState({
    loading: true,
    error: "",
    attemptId: null,
    exam: null,
    endAt: null,
    answers: {},
    remaining: 0,
    violations: 0,
    overlay: null, // { reason, until }
  });

  const intervalRef = useRef(null);
  const saveTimerRef = useRef(null);
  const answersRef = useRef({});

  const requestFullscreen = async () => {
    const el = document.documentElement;
    if (el.requestFullscreen) await el.requestFullscreen();
  };

  const exitFullscreen = async () => {
    if (document.fullscreenElement && document.exitFullscreen) await document.exitFullscreen();
  };

  const syncCountdown = (endISO) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const end = new Date(endISO).getTime();
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((end - now) / 1000));
      setState((s) => ({ ...s, remaining: diff }));
    }, 500);
  };

  const performStart = async () => {
    try {
      const { data } = await startAttempt(examId);
      const { attemptId, exam, serverEndTime } = data;
      setState((s) => ({ ...s, loading: false, attemptId, exam, endAt: serverEndTime }));
      syncCountdown(serverEndTime);
      await requestFullscreen();
    } catch (e) {
      setState((s) => ({ ...s, loading: false, error: e?.response?.data?.message || e?.response?.data?.error || "Failed to start attempt" }));
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { navigate("/login"); return; }
    const u = JSON.parse(stored);
    if (u.role !== "student") { navigate("/"); return; }
    performStart();
    // cleanup
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId]);

  // Auto-submit when time runs out
  useEffect(() => {
    if (state.remaining === 0 && state.attemptId) {
      (async () => { await handleSubmit(true); })();
    }
  }, [state.remaining, state.attemptId]);

  // Proctoring handlers
  useEffect(() => {
    const onVisibility = async () => {
      if (document.visibilityState === "hidden") {
        await registerViolation("visibility-hidden", { reason: "tab hidden" });
      }
    };
    const onBlur = async () => {
      await registerViolation("tab-blur");
    };
    const onFsChange = async () => {
      if (!document.fullscreenElement) {
        await registerViolation("fullscreen-exit");
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("fullscreenchange", onFsChange);
    };
  }, [state.attemptId]);

  const registerViolation = async (type, meta) => {
    if (!state.attemptId) return;
    try { await logProctorEvent(state.attemptId, type, meta); } catch {}

    // show overlay with countdown
    const until = Date.now() + RETURN_TIMEOUT_SECONDS * 1000;
    setState((s) => ({ ...s, violations: s.violations + 1, overlay: { reason: type, until } }));

    const check = setInterval(async () => {
      if (document.fullscreenElement && document.visibilityState === "visible") {
        clearInterval(check);
        setState((s) => ({ ...s, overlay: null }));
        return;
      }
      if (Date.now() >= until) {
        clearInterval(check);
        // timeout -> submit
        await handleSubmit(true);
      }
    }, 500);

    if (state.violations + 1 >= VIOLATION_LIMIT) {
      await handleSubmit(true);
    }
  };

  const scheduleSave = (answersPatch) => {
    setState((s) => {
      const next = { ...s.answers, ...answersPatch };
      answersRef.current = next;
      return { ...s, answers: next };
    });
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      const payload = Object.entries(answersRef.current).map(([k, v]) => ({ questionIndex: Number(k), value: v }));
      try { await saveAttempt(state.attemptId, payload); } catch {}
    }, AUTOSAVE_MS);
  };

  const handleChange = (qIdx, value) => {
    scheduleSave({ [qIdx]: value });
  };

  const handleSubmit = async (auto = false) => {
    try {
      await submitAttempt(state.attemptId);
    } catch (e) {
      // ignore
    }
    await exitFullscreen();
    navigate("/exams");
  };

  if (state.loading) return <div className="p-6">Loading...</div>;
  if (state.error) return <div className="p-6 text-red-600">{state.error}</div>;

  const exam = state.exam;
  const secs = state.remaining;
  const mm = Math.floor(secs / 60);
  const ss = (secs % 60).toString().padStart(2, '0');

  return (
    <div className="max-w-5xl mx-auto p-4">
      {state.overlay && (
        <div className="fixed inset-0 bg-black/70 text-white flex flex-col items-center justify-center z-50">
          <h2 className="text-2xl font-bold mb-2">Stay on the exam</h2>
          <p className="mb-4">Violation detected: {state.overlay.reason}. Return within {Math.max(0, Math.ceil((state.overlay.until - Date.now())/1000))}s or the exam will be submitted.</p>
          <button className="bg-white text-black px-4 py-2 rounded" onClick={requestFullscreen}>Return now</button>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">{exam.title}</h1>
        <div className="text-lg font-semibold">Time left: {mm}:{ss}</div>
      </div>
      <p className="text-gray-700 mb-4">{exam.description}</p>

      <div className="space-y-4">
        {exam.questions.map((q, idx) => (
          <div key={idx} className="bg-white rounded shadow p-4">
            <div className="font-medium mb-2">Q{idx + 1}. {q.text} <span className="text-sm text-gray-500">({q.points} pts)</span></div>
            {q.type === 'text' && (
              <textarea className="border rounded w-full px-3 py-2" rows={3} onChange={(e)=>handleChange(idx, e.target.value)} />
            )}
            {q.type === 'single' && (
              <div className="space-y-1">
                {(q.options || []).map((opt, oi) => (
                  <label key={oi} className="block"><input type="radio" name={`q-${idx}`} onChange={()=>handleChange(idx, oi)} /> <span className="ml-2">{opt}</span></label>
                ))}
              </div>
            )}
            {q.type === 'mcq' && (
              <div className="space-y-1">
                {(q.options || []).map((opt, oi) => (
                  <label key={oi} className="block"><input type="checkbox" onChange={(e)=>{
                    const prev = new Set(Array.isArray(answersRef.current[idx]) ? answersRef.current[idx] : []);
                    e.target.checked ? prev.add(oi) : prev.delete(oi);
                    handleChange(idx, Array.from(prev).sort((a,b)=>a-b));
                  }} /> <span className="ml-2">{opt}</span></label>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="py-4">
        <button className="bg-green-600 text-white px-4 py-2 rounded" onClick={()=>handleSubmit(false)}>Submit</button>
      </div>
    </div>
  );
};

export default ExamRunner;
