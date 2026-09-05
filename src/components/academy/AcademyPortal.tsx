"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/services/api";
import { ACADEMY_COURSES, getAcademyCourse, type AcademyCourseId } from "@/lib/academyCatalog";

type PortalCourse = {
  id: AcademyCourseId;
  title: string;
  lede: string;
  icon: string;
  totalLessons: number;
  completedLessons: number;
  percent: number;
  examPassed: boolean;
};

type Certificate = {
  courseId: AcademyCourseId;
  certId: string;
  courseTitle: string;
  issuedAt: string;
  studentName: string;
};

type PortalState = {
  portalAccess: boolean;
  hasEnrollment: boolean;
  accessibleCourseIds: AcademyCourseId[];
  enrollmentIds: string[];
  studentName: string;
  userEmail: string | null;
  enteredWith: string | null;
  courses: PortalCourse[];
  progress: Record<string, { completedLessons: number[]; examPassed?: boolean }>;
  certificates: Certificate[];
};

type View = "dashboard" | "course" | "exam" | "certificates";

function formatCertDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function courseStatusLabel(course: PortalCourse) {
  if (course.examPassed) return "Completed";
  if (course.completedLessons === 0) return "Not started";
  if (course.completedLessons >= course.totalLessons) return "Ready for exam";
  return "In progress";
}

export default function AcademyPortal() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [portal, setPortal] = useState<PortalState | null>(null);
  const [loading, setLoading] = useState(true);
  const [entered, setEntered] = useState(false);
  const [accessCode, setAccessCode] = useState("");
  const [gateError, setGateError] = useState("");
  const [gateLoading, setGateLoading] = useState(false);

  const [view, setView] = useState<View>("dashboard");
  const [activeCourse, setActiveCourse] = useState<AcademyCourseId | null>(null);
  const [activeLesson, setActiveLesson] = useState(0);
  const [savingLesson, setSavingLesson] = useState(false);

  const [examIdx, setExamIdx] = useState(0);
  const [examAnswers, setExamAnswers] = useState<number[]>([]);
  const [examSubmitting, setExamSubmitting] = useState(false);
  const [examResult, setExamResult] = useState<{ passed: boolean; score: number } | null>(null);

  const [copied, setCopied] = useState(false);

  const loadPortal = useCallback(async () => {
    const res = await api.get("/academy/portal");
    const data = res.data as PortalState;
    setPortal(data);
    setEntered(Boolean(data.portalAccess));
    if (!data.portalAccess && data.enrollmentIds?.length === 1) {
      setAccessCode(data.enrollmentIds[0]);
    }
    return data;
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace(`/login?redirectTo=${encodeURIComponent("/academy")}`);
      return;
    }
    (async () => {
      setLoading(true);
      try {
        await loadPortal();
      } catch {
        setGateError("Could not load academy portal.");
      } finally {
        setLoading(false);
      }
    })();
  }, [user, authLoading, router, loadPortal]);

  const enterPortal = async () => {
    setGateError("");
    setGateLoading(true);
    try {
      await api.post("/academy/enter", { enrollmentId: accessCode.trim() });
      setEntered(true);
      await loadPortal();
    } catch (err: unknown) {
      const response = (err as { response?: { data?: { error?: string; code?: string } } })?.response;
      const message = response?.data?.error || "Invalid enrollment ID.";
      setGateError(message);
      setEntered(false);
    } finally {
      setGateLoading(false);
    }
  };

  const openCourse = (id: AcademyCourseId) => {
    const course = portal?.courses.find((c) => c.id === id);
    const completed = portal?.progress[id]?.completedLessons || [];
    const catalog = getAcademyCourse(id);
    if (!catalog) return;

    let lesson = catalog.lessons.findIndex((_, i) => !completed.includes(i));
    if (lesson === -1) lesson = 0;

    setActiveCourse(id);
    setActiveLesson(lesson);
    setView("course");
  };

  const completedForCourse = (courseId: AcademyCourseId) =>
    portal?.progress[courseId]?.completedLessons || [];

  const markComplete = async () => {
    if (!activeCourse) return;
    setSavingLesson(true);
    try {
      await api.patch(`/academy/progress/${activeCourse}`, {
        lessonIndex: activeLesson,
        completed: true,
      });
      const data = await loadPortal();
      const completed = data.progress[activeCourse]?.completedLessons || [];
      const catalog = getAcademyCourse(activeCourse)!;
      const next = catalog.lessons.findIndex((_, i) => !completed.includes(i));
      if (next !== -1 && next !== activeLesson) setActiveLesson(next);
    } catch (err: unknown) {
      const code = (err as { response?: { data?: { code?: string } } })?.response?.data?.code;
      if (code === "ACADEMY_GATE_REQUIRED") {
        setEntered(false);
        setView("dashboard");
      }
    } finally {
      setSavingLesson(false);
    }
  };

  const allLessonsDone =
    activeCourse &&
    getAcademyCourse(activeCourse)?.lessons.every((_, i) =>
      completedForCourse(activeCourse).includes(i)
    );

  const startExam = () => {
    setExamIdx(0);
    setExamAnswers([]);
    setExamResult(null);
    setView("exam");
  };

  const submitExam = async () => {
    if (!activeCourse) return;
    const catalog = getAcademyCourse(activeCourse)!;
    if (examAnswers.length < catalog.exam.length) return;

    setExamSubmitting(true);
    try {
      const res = await api.post(`/academy/exam/${activeCourse}/submit`, { answers: examAnswers });
      setExamResult({ passed: res.data.passed, score: res.data.score });
      await loadPortal();
      if (res.data.passed) {
        setTimeout(() => setView("certificates"), 1500);
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        "Exam submission failed.";
      alert(message);
    } finally {
      setExamSubmitting(false);
    }
  };

  const nextExamQuestion = () => {
    const catalog = activeCourse ? getAcademyCourse(activeCourse) : null;
    if (!catalog) return;
    if (examAnswers[examIdx] === undefined) return;

    if (examIdx < catalog.exam.length - 1) {
      setExamIdx((i) => i + 1);
    } else {
      submitExam();
    }
  };

  const accessLabel = () => {
    if (!portal?.accessibleCourseIds.length) return "No courses";
    return portal.accessibleCourseIds
      .map((id) => ACADEMY_COURSES[id]?.title || id)
      .join(" + ");
  };

  if (authLoading || loading) {
    return (
      <div className="academy-root academy-gate-wrap">
        <p style={{ color: "#8b93a8" }}>Loading academy portal…</p>
      </div>
    );
  }

  if (!entered) {
    return (
      <div className="academy-root academy-gate-wrap">
        <div className="academy-gate-card">
          <Link href="/dashboard?tab=courses" className="academy-back-dash" style={{ marginBottom: 12 }}>
            ← Back to dashboard
          </Link>
          <div className="academy-brand">Ink2Wealth Academy</div>
          {user?.email ? (
            <p style={{ fontSize: 12, color: "#8b93a8", margin: "0 0 12px" }}>
              Logged in as <strong style={{ color: "#eef1f8" }}>{user.email}</strong>
            </p>
          ) : null}
          <p>
            Enter the portal using <strong>your own</strong> enrollment ID from the Courses tab. Each ID works
            only on the account that purchased that course.
          </p>
          {portal?.enrollmentIds?.length ? (
            <p style={{ fontSize: 12, color: "#e8b44c", marginBottom: 14 }}>
              Your ID{portal.enrollmentIds.length > 1 ? "s" : ""}: {portal.enrollmentIds.join(" · ")}
            </p>
          ) : null}
          {gateError ? <p className="academy-gate-error">{gateError}</p> : null}
          {!portal?.hasEnrollment ? (
            <div className="academy-empty" style={{ marginBottom: 16 }}>
              <p>
                This account has no paid course enrollment. Enroll first, then use the unique ID from your
                Courses tab to enter the academy.
              </p>
              <Link href="/courses" className="academy-btn" style={{ display: "inline-block", marginTop: 14, textDecoration: "none" }}>
                Browse courses
              </Link>
            </div>
          ) : (
            <>
              <div className="academy-field">
                <label>Access code (from your payment confirmation)</label>
                <input
                  type="text"
                  placeholder="e.g. WIT-WEB-0001"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && enterPortal()}
                />
              </div>
              <button className="academy-btn" onClick={enterPortal} disabled={gateLoading || !accessCode.trim()}>
                {gateLoading ? "Verifying…" : "Enter portal"}
              </button>
            </>
          )}
          <div className="academy-gate-note">
            Academy access requires login + a valid enrollment on this account. Another user&apos;s ID will
            not work here.
          </div>
        </div>
      </div>
    );
  }

  const catalog = activeCourse ? getAcademyCourse(activeCourse) : null;
  const completed = activeCourse ? completedForCourse(activeCourse) : [];
  const currentLesson = catalog?.lessons[activeLesson];

  return (
    <div className="academy-root">
      <div className="academy-app">
        <aside className="academy-sidebar">
          <div>
            <div className="academy-brand">
              Ink2Wealth<small>Academy Portal</small>
            </div>
            <Link href="/dashboard?tab=courses" className="academy-back-dash" style={{ marginTop: 12 }}>
              ← Dashboard
            </Link>
          </div>
          <nav className="academy-nav">
            <button
              type="button"
              className={view === "dashboard" ? "active" : ""}
              onClick={() => setView("dashboard")}
            >
              🏠 Dashboard
            </button>
            <button
              type="button"
              className={view === "course" ? "active" : ""}
              onClick={() => activeCourse && setView("course")}
              disabled={!activeCourse}
            >
              📘 Current course
            </button>
            <button
              type="button"
              className={view === "certificates" ? "active" : ""}
              onClick={() => setView("certificates")}
            >
              🏆 Certificates
            </button>
          </nav>
          <div className="academy-side-foot">
            Signed in as
            <br />
            <strong style={{ color: "var(--text)" }}>
              {portal?.studentName || "Student"} · {accessLabel()}
            </strong>
          </div>
        </aside>

        <main className="academy-main">
          {/* DASHBOARD */}
          <div className={`academy-view ${view === "dashboard" ? "active" : ""}`}>
            <h1>Welcome back</h1>
            <p className="academy-lede">Pick up where you left off, or start a course you&apos;ve paid for.</p>
            <div className="academy-course-grid">
              {(portal?.courses || []).map((course) => (
                <button
                  key={course.id}
                  type="button"
                  className="academy-course-card"
                  onClick={() => openCourse(course.id)}
                >
                  <div className="academy-cc-top">
                    <span className="academy-cc-icon">{course.icon}</span>
                    <span className="academy-cc-tag">{courseStatusLabel(course)}</span>
                  </div>
                  <h3>{course.title}</h3>
                  <div className="desc">{course.lede}</div>
                  <div className="academy-progress-track">
                    <div className="academy-progress-fill" style={{ width: `${course.percent}%` }} />
                  </div>
                  <div className="academy-progress-label">
                    <span>
                      {course.completedLessons} of {course.totalLessons} lessons
                    </span>
                    <span>{course.percent}%</span>
                  </div>
                </button>
              ))}
            </div>
            {!portal?.courses?.length ? (
              <div className="academy-empty">
                <p>No active course enrollments. Enroll in WIT-WEB or SSG to access the portal.</p>
                <Link href="/courses" className="academy-btn" style={{ display: "inline-block", marginTop: 14, textDecoration: "none" }}>
                  Ink2Wealth Academy
                </Link>
              </div>
            ) : null}
          </div>

          {/* COURSE */}
          {catalog && activeCourse ? (
            <div className={`academy-view ${view === "course" ? "active" : ""}`}>
              <h1>{catalog.title}</h1>
              <p className="academy-lede">{catalog.lede}</p>
              <div className="academy-course-detail">
                <div className="academy-lesson-list">
                  {catalog.lessons.map((lesson, i) => (
                    <div
                      key={lesson.title}
                      className={`academy-lesson ${completed.includes(i) ? "done" : ""} ${i === activeLesson ? "active" : ""}`}
                      onClick={() => setActiveLesson(i)}
                      onKeyDown={(e) => e.key === "Enter" && setActiveLesson(i)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="check">✓</div>
                      <div className="lt">
                        <h5>{lesson.title}</h5>
                        <span>{lesson.duration}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="academy-player-wrap">
                  <div className="academy-player">
                    ▶
                    <div className="playhead">
                      <div />
                    </div>
                  </div>
                  {currentLesson ? (
                    <>
                      <div className="academy-lesson-title">
                        Module {activeLesson + 1} — {currentLesson.title}
                      </div>
                      <div className="academy-lesson-meta">
                        {currentLesson.duration} · Module {activeLesson + 1} of {catalog.lessons.length}
                      </div>
                    </>
                  ) : null}
                  <div className="academy-action-row">
                    <button
                      type="button"
                      className="academy-btn"
                      onClick={markComplete}
                      disabled={savingLesson || completed.includes(activeLesson)}
                    >
                      {completed.includes(activeLesson) ? "Completed ✓" : savingLesson ? "Saving…" : "Mark lesson complete"}
                    </button>
                    <button type="button" className="academy-btn academy-btn-outline" onClick={() => setView("dashboard")}>
                      Back to dashboard
                    </button>
                  </div>
                  {allLessonsDone && !portal?.progress[activeCourse]?.examPassed ? (
                    <div className="academy-exam-cta">
                      <h4>All lessons complete</h4>
                      <p>You&apos;ve finished every module in this course. Take the exam to earn your certificate.</p>
                      <button type="button" className="academy-btn" onClick={startExam}>
                        Take {catalog.title} exam
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          {/* EXAM */}
          {catalog && activeCourse && view === "exam" ? (
            <div className="academy-view active">
              <h1>{catalog.title} exam</h1>
              <p className="academy-lede">
                {catalog.exam.length} questions · {catalog.passScore}% required to pass and unlock your certificate.
              </p>
              {examResult ? (
                <div className="academy-exam-q">
                  <h3 style={{ color: examResult.passed ? "var(--green)" : "#e05252" }}>
                    {examResult.passed ? "You passed!" : "Not quite — try again"}
                  </h3>
                  <p style={{ color: "var(--sub)" }}>Score: {examResult.score}%</p>
                  {examResult.passed ? (
                    <button type="button" className="academy-btn" style={{ marginTop: 16 }} onClick={() => setView("certificates")}>
                      View certificate
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="academy-btn academy-btn-outline"
                      style={{ marginTop: 16 }}
                      onClick={() => {
                        setExamResult(null);
                        setExamIdx(0);
                        setExamAnswers([]);
                      }}
                    >
                      Retry exam
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="academy-exam-progress">
                    {catalog.exam.map((_, i) => (
                      <div key={i} className={i < examIdx ? "done" : ""} />
                    ))}
                  </div>
                  <div className="academy-exam-q">
                    <div className="qnum">
                      Question {examIdx + 1} of {catalog.exam.length}
                    </div>
                    <h3>{catalog.exam[examIdx].question}</h3>
                    {catalog.exam[examIdx].options.map((opt, i) => (
                      <div
                        key={opt}
                        className={`academy-option ${examAnswers[examIdx] === i ? "selected" : ""}`}
                        onClick={() => {
                          const next = [...examAnswers];
                          next[examIdx] = i;
                          setExamAnswers(next);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            const next = [...examAnswers];
                            next[examIdx] = i;
                            setExamAnswers(next);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                      >
                        <span className="letter">{String.fromCharCode(65 + i)}</span>
                        {opt}
                      </div>
                    ))}
                  </div>
                  <div className="academy-action-row" style={{ marginTop: 18, maxWidth: 600 }}>
                    <button
                      type="button"
                      className="academy-btn"
                      onClick={nextExamQuestion}
                      disabled={examAnswers[examIdx] === undefined || examSubmitting}
                    >
                      {examSubmitting
                        ? "Submitting…"
                        : examIdx === catalog.exam.length - 1
                          ? "Submit exam"
                          : "Next question"}
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : null}

          {/* CERTIFICATES */}
          <div className={`academy-view ${view === "certificates" ? "active" : ""}`}>
            <h1>Certificates</h1>
            <p className="academy-lede">Earned once you pass a course exam. Downloadable and shareable.</p>
            {portal?.certificates?.length ? (
              portal.certificates.map((cert) => (
                <div key={cert.certId} className="academy-cert-wrap">
                  <div className="academy-cert">
                    <div className="kicker">CERTIFICATE OF COMPLETION</div>
                    <div className="academy-brand" style={{ marginBottom: 18 }}>
                      Ink2Wealth Academy
                    </div>
                    <div className="cname">{cert.studentName}</div>
                    <div className="cfor">has successfully completed</div>
                    <div className="ccourse">{cert.courseTitle}</div>
                    <div className="cmeta">
                      <span>Completed: {formatCertDate(cert.issuedAt)}</span>
                      <span>Cert ID: {cert.certId}</span>
                    </div>
                  </div>
                  <div className="academy-cert-actions">
                    <button
                      type="button"
                      className="academy-btn"
                      onClick={() => window.print()}
                    >
                      Download PDF
                    </button>
                    <button
                      type="button"
                      className="academy-btn academy-btn-outline"
                      onClick={async () => {
                        const link = `${window.location.origin}/academy?cert=${cert.certId}`;
                        await navigator.clipboard.writeText(link);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                    >
                      {copied ? "Copied!" : "Copy share link"}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="academy-empty">
                <p>Complete a course and pass the exam to earn your certificate.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
