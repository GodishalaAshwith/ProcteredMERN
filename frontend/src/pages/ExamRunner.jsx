import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  logProctorEvent,
  saveAttempt,
  startAttempt,
  submitAttempt,
} from "../utils/api";

const VIOLATION_LIMIT = 3;
const RETURN_TIMEOUT_SECONDS = 10;
const AUTOSAVE_MS = 3000;

const ExamRunner = () => {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [state, setState] = useState({
    loading: false,
    error: "",
    attemptId: null,
    exam: null,
    endAt: null,
    answers: {},
    remaining: 0,
    violations: 0,
    overlay: null,
    started: false,
    submitted: false,
    result: null,
    showSubmitConfirm: false,
  });

  const intervalRef = useRef(null);
  const saveTimerRef = useRef(null);
  const answersRef = useRef({});
  const ignoreFsChangeRef = useRef(false);
  const proctorListenersAttached = useRef(false);
  const isSubmittingRef = useRef(false);

  const requestFullscreen = async () => {
    const el = document.documentElement;
    if (el.requestFullscreen && !document.fullscreenElement) {
      try {
        ignoreFsChangeRef.current = true;
        await el.requestFullscreen();
        // Give browser time to process fullscreen
        await new Promise((resolve) => setTimeout(resolve, 300));
      } catch (e) {
        console.error("Fullscreen request failed:", e);
        ignoreFsChangeRef.current = false;
      }
    }
  };

  const exitFullscreen = async () => {
    if (document.fullscreenElement && document.exitFullscreen) {
      try {
        await document.exitFullscreen();
      } catch (e) {
        console.error("Exit fullscreen failed:", e);
      }
    }
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

  // Use useCallback to stabilize handleSubmit reference
  const handleSubmit = useCallback(
    async (auto = false) => {
      if (isSubmittingRef.current) return;
      if (!state.attemptId || state.submitted) return;

      // If manual submit, show confirmation first
      if (!auto) {
        setState((s) => ({ ...s, showSubmitConfirm: true }));
        return;
      }

      // Auto-submit (time expired or violations)
      isSubmittingRef.current = true;

      try {
        const { data } = await submitAttempt(state.attemptId);
        setState((s) => ({
          ...s,
          submitted: true,
          result: data,
          showSubmitConfirm: false,
        }));
      } catch (e) {
        const res = e?.response?.data;
        if (res && res.score !== undefined) {
          setState((s) => ({
            ...s,
            submitted: true,
            result: res,
            showSubmitConfirm: false,
          }));
        } else {
          setState((s) => ({
            ...s,
            error:
              e?.response?.data?.message ||
              e?.response?.data?.error ||
              "Failed to submit",
            showSubmitConfirm: false,
          }));
        }
      } finally {
        isSubmittingRef.current = false;
        await exitFullscreen();
      }
    },
    [state.attemptId, state.submitted]
  );

  const confirmSubmit = async () => {
    if (isSubmittingRef.current) return;
    if (!state.attemptId || state.submitted) return;

    isSubmittingRef.current = true;

    try {
      const { data } = await submitAttempt(state.attemptId);
      setState((s) => ({
        ...s,
        submitted: true,
        result: data,
        showSubmitConfirm: false,
      }));
    } catch (e) {
      const res = e?.response?.data;
      if (res && res.score !== undefined) {
        setState((s) => ({
          ...s,
          submitted: true,
          result: res,
          showSubmitConfirm: false,
        }));
      } else {
        setState((s) => ({
          ...s,
          error:
            e?.response?.data?.message ||
            e?.response?.data?.error ||
            "Failed to submit",
          showSubmitConfirm: false,
        }));
      }
    } finally {
      isSubmittingRef.current = false;
      await exitFullscreen();
    }
  };

  const cancelSubmit = () => {
    setState((s) => ({ ...s, showSubmitConfirm: false }));
  };

  const registerViolation = useCallback(
    async (type, meta) => {
      if (!state.attemptId || state.submitted) return;

      try {
        await logProctorEvent(state.attemptId, type, meta);
      } catch {}

      const until = Date.now() + RETURN_TIMEOUT_SECONDS * 1000;
      setState((s) => ({
        ...s,
        violations: s.violations + 1,
        overlay: { reason: type, until },
      }));

      const check = setInterval(async () => {
        if (
          document.fullscreenElement &&
          document.visibilityState === "visible"
        ) {
          clearInterval(check);
          setState((s) => ({ ...s, overlay: null }));
          return;
        }
        if (Date.now() >= until) {
          clearInterval(check);
          // Remove auto-submit on timeout - just clear the overlay
          setState((s) => ({ ...s, overlay: null }));
        }
      }, 500);

      // Remove auto-submit when violation limit is reached
      // if (state.violations + 1 >= VIOLATION_LIMIT) {
      //   clearInterval(check);
      //   await handleSubmit(true);
      // }
    },
    [state.attemptId, state.submitted, state.violations, handleSubmit]
  );

  const performStart = async () => {
    setState((s) => ({ ...s, loading: true, error: "" }));
    try {
      const { data } = await startAttempt(examId);
      const { attemptId, exam, serverEndTime } = data;

      // Request fullscreen FIRST
      await requestFullscreen();

      // Wait longer for fullscreen to stabilize
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Now set started to true - this will trigger proctoring listeners
      setState((s) => ({
        ...s,
        loading: false,
        attemptId,
        exam,
        endAt: serverEndTime,
        started: true,
      }));

      syncCountdown(serverEndTime);

      // Reset the ignore flag after everything is set up
      setTimeout(() => {
        ignoreFsChangeRef.current = false;
      }, 1000);
    } catch (e) {
      setState((s) => ({
        ...s,
        loading: false,
        error:
          e?.response?.data?.message ||
          e?.response?.data?.error ||
          "Failed to start attempt",
      }));
      await exitFullscreen();
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      navigate("/login");
      return;
    }
    const u = JSON.parse(stored);
    if (u.role !== "student") {
      navigate("/");
      return;
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [examId, navigate]);

  // Auto-submit when time runs out - DISABLED
  // useEffect(() => {
  //   if (
  //     state.remaining === 0 &&
  //     state.attemptId &&
  //     !state.submitted &&
  //     !isSubmittingRef.current
  //   ) {
  //     handleSubmit(true);
  //   }
  // }, [state.remaining, state.attemptId, state.submitted, handleSubmit]);

  // Proctoring handlers - attach only once
  useEffect(() => {
    if (
      !state.started ||
      !state.attemptId ||
      state.submitted ||
      proctorListenersAttached.current
    ) {
      return;
    }

    proctorListenersAttached.current = true;

    const onVisibility = async () => {
      if (document.visibilityState === "hidden" && !state.submitted) {
        await registerViolation("visibility-hidden", { reason: "tab hidden" });
      }
    };

    const onBlur = async () => {
      if (!state.submitted) {
        await registerViolation("tab-blur");
      }
    };

    const onFsChange = async () => {
      // Always check the ignore flag first
      if (ignoreFsChangeRef.current) {
        return; // Don't reset the flag here
      }

      if (!document.fullscreenElement && !state.submitted) {
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
      proctorListenersAttached.current = false;
    };
  }, [state.started, state.attemptId, state.submitted, registerViolation]);

  const scheduleSave = (answersPatch) => {
    setState((s) => {
      const next = { ...s.answers, ...answersPatch };
      answersRef.current = next;
      return { ...s, answers: next };
    });
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      const payload = Object.entries(answersRef.current).map(([k, v]) => ({
        questionIndex: Number(k),
        value: v,
      }));
      try {
        await saveAttempt(state.attemptId, payload);
      } catch {}
    }, AUTOSAVE_MS);
  };

  const handleChange = (qIdx, value) => {
    scheduleSave({ [qIdx]: value });
  };

  const exitAfterSubmit = () => {
    navigate("/exams");
  };

  if (state.loading) return <div className="p-6">Loading...</div>;
  if (state.error) return <div className="p-6 text-red-600">{state.error}</div>;

  if (!state.started) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-2">Ready to start your test?</h1>
        <p className="text-gray-700 mb-4">
          When you start, the exam will enter fullscreen and proctoring will
          begin. Please avoid switching tabs or exiting fullscreen. Your time
          will start immediately.
        </p>
        <div className="flex gap-3">
          <button
            className="bg-indigo-600 text-white px-4 py-2 rounded"
            onClick={performStart}
          >
            Start Test
          </button>
          <button className="text-gray-700" onClick={() => navigate(-1)}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  const exam = state.exam;
  const secs = state.remaining;
  const mm = Math.floor(secs / 60);
  const ss = (secs % 60).toString().padStart(2, "0");

  return (
    <div className="max-w-5xl mx-auto p-4">
      {state.overlay && (
        <div className="fixed inset-0 bg-black/70 text-white flex flex-col items-center justify-center z-50">
          <h2 className="text-2xl font-bold mb-2">Stay on the exam</h2>
          <p className="mb-4">
            Violation detected: {state.overlay.reason}. Please return to the
            exam to continue.
          </p>
          <button
            className="bg-white text-black px-4 py-2 rounded"
            onClick={requestFullscreen}
          >
            Return now
          </button>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">{exam.title}</h1>
        <div
          className={`text-lg font-semibold ${
            state.remaining === 0 ? "text-red-600" : ""
          }`}
        >
          {state.remaining === 0
            ? "Time expired - Please submit your exam"
            : `Time left: ${mm}:${ss}`}
        </div>
      </div>

      {state.remaining === 0 && !state.submitted && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
          <strong>Time has expired!</strong> Please submit your exam when you
          are ready. You can still review and modify your answers.
        </div>
      )}

      <p className="text-gray-700 mb-4">{exam.description}</p>

      {state.submitted && (
        <div className="bg-white rounded shadow p-6 my-4">
          <h2 className="text-xl font-semibold mb-2">Test submitted</h2>
          {state.result && (
            <div className="text-gray-800">
              <div>
                Score:{" "}
                <span className="font-semibold">{state.result.score}</span>
              </div>
              {state.result.manualNeeded && (
                <div className="text-sm text-gray-600">
                  Some answers require manual grading. Final score may change.
                </div>
              )}
              <div className="text-sm text-gray-600">
                Submitted at:{" "}
                {state.result.submittedAt
                  ? new Date(state.result.submittedAt).toLocaleString()
                  : "-"}
              </div>
            </div>
          )}
          <div className="pt-3">
            <button
              className="bg-indigo-600 text-white px-4 py-2 rounded"
              onClick={exitAfterSubmit}
            >
              Exit test
            </button>
          </div>
        </div>
      )}

      {!state.submitted && (
        <div className="space-y-4">
          {exam.questions.map((q, idx) => (
            <div key={idx} className="bg-white rounded shadow p-4">
              <div className="font-medium mb-2">
                Q{idx + 1}. {q.text}{" "}
                <span className="text-sm text-gray-500">({q.points} pts)</span>
              </div>
              {q.type === "text" && (
                <textarea
                  className="border rounded w-full px-3 py-2"
                  rows={3}
                  value={state.answers[idx] || ""}
                  onChange={(e) => handleChange(idx, e.target.value)}
                  disabled={state.submitted}
                />
              )}
              {q.type === "single" && (
                <div className="space-y-1">
                  {(q.options || []).map((opt, oi) => (
                    <label key={oi} className="block">
                      <input
                        type="radio"
                        name={`q-${idx}`}
                        checked={state.answers[idx] === oi}
                        onChange={() => handleChange(idx, oi)}
                        disabled={state.submitted}
                      />{" "}
                      <span className="ml-2">{opt}</span>
                    </label>
                  ))}
                </div>
              )}
              {q.type === "mcq" && (
                <div className="space-y-1">
                  {(q.options || []).map((opt, oi) => (
                    <label key={oi} className="block">
                      <input
                        type="checkbox"
                        checked={
                          Array.isArray(state.answers[idx]) &&
                          state.answers[idx].includes(oi)
                        }
                        disabled={state.submitted}
                        onChange={(e) => {
                          const prev = new Set(
                            Array.isArray(state.answers[idx])
                              ? state.answers[idx]
                              : []
                          );
                          e.target.checked ? prev.add(oi) : prev.delete(oi);
                          handleChange(
                            idx,
                            Array.from(prev).sort((a, b) => a - b)
                          );
                        }}
                      />{" "}
                      <span className="ml-2">{opt}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="py-4">
        {!state.submitted ? (
          <button
            className="bg-green-600 text-white px-4 py-2 rounded"
            onClick={() => handleSubmit(false)}
          >
            Submit test
          </button>
        ) : (
          <button
            className="bg-indigo-600 text-white px-4 py-2 rounded"
            onClick={exitAfterSubmit}
          >
            Exit test
          </button>
        )}
      </div>
    </div>
  );
};

export default ExamRunner;
