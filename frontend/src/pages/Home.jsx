import { useEffect } from "react";
import { Link } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";

const Home = () => {
  useEffect(() => {
    AOS.init({ duration: 1000, once: false, mirror: true });
  }, []);

  return (
    <div className="bg-slate-50 text-slate-900 font-sans">
      {/* Hero Section */}
      <section
        className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-800 text-white min-h-[calc(100svh-56px)] md:min-h-[calc(100svh-64px)] flex items-center"
        data-aos="fade-up"
      >
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-center">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold leading-tight tracking-tight max-w-4xl mx-auto break-words">
            ProcTesting
          </h1>
          <p className="text-sm sm:text-lg md:text-xl max-w-3xl mx-auto mt-4 text-slate-200 leading-relaxed">
            Create, deliver, and review online exams with built‑in anti‑cheat
            protections.
          </p>
          {localStorage.getItem("token") ? (
            <Link
              to="/dashboard"
              className="mt-6 inline-flex items-center justify-center w-full sm:w-auto px-6 sm:px-8 py-3 bg-emerald-500 text-slate-900 font-semibold rounded-full shadow-lg hover:bg-emerald-400 transition-colors text-base sm:text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
            >
              Go to Dashboard
            </Link>
          ) : (
            <Link
              to="/register"
              className="mt-6 inline-flex items-center justify-center w-full sm:w-auto px-6 sm:px-8 py-3 bg-emerald-500 text-slate-900 font-semibold rounded-full shadow-lg hover:bg-emerald-400 transition-colors text-base sm:text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
            >
              Get Started
            </Link>
          )}
        </div>
      </section>

      {/* What you can do */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="mx-auto w-full max-w-7xl text-center">
          <h2
            className="text-3xl sm:text-5xl font-bold mb-8 sm:mb-12 text-slate-800"
            data-aos="fade-up"
          >
            What you can do
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 max-w-7xl mx-auto">
          {[
            {
              title: "Create Exams",
              desc: "Use the Exam Editor to set timing, assignment, and questions. Import from Google Sheets/Docs.",
            },
            {
              title: "Run Proctored Exams",
              desc: "Fullscreen required, copy/context‑menu disabled, and tab/app switch detection with warnings.",
            },
            {
              title: "Review & Export",
              desc: "Inspect attempts and proctoring events; export submissions to CSV or Excel.",
            },
          ].map((item, index) => (
            <div
              key={index}
              className="bg-white p-6 sm:p-8 lg:p-10 rounded-xl shadow-lg hover:shadow-2xl transition-transform hover:-translate-y-1 border border-slate-200 h-full"
              data-aos="fade-up"
              data-aos-anchor-placement="top-bottom"
              data-aos-delay={`${index * 200}`}
            >
              <h3 className="text-xl sm:text-2xl font-semibold mb-3 text-emerald-700">
                {item.title}
              </h3>
              <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Key features (from README) */}
      <section
        className="bg-slate-100 px-4 sm:px-6 lg:px-8 py-16 sm:py-24"
        data-aos="fade-up"
      >
        <div className="mx-auto w-full max-w-7xl text-center">
          <h2 className="text-3xl sm:text-5xl font-bold mb-8 sm:mb-12 text-slate-800">
            Key features
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 max-w-7xl mx-auto">
          {[
            "Fullscreen exam runner; copy/cut/context‑menu and selection disabled",
            "Tab/app switch detection with warnings and violation timeout",
            "Submissions review with proctoring events; CSV/Excel exports",
          ].map((point, index) => (
            <div
              key={index}
              className="bg-white p-6 sm:p-8 lg:p-10 rounded-xl shadow-lg hover:shadow-2xl transition-transform hover:-translate-y-1 border border-slate-200 h-full"
              data-aos="fade-up"
              data-aos-anchor-placement="top-bottom"
              data-aos-delay={`${index * 200}`}
            >
              <h3 className="text-xl sm:text-2xl font-semibold text-emerald-700">
                {point}
              </h3>
              <p className="text-slate-600 mt-3 text-base sm:text-lg leading-relaxed">
                Built with React, Node.js/Express, and MongoDB.
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* No testimonials or fabricated claims; only factual project info */}

      {/* Page-level footer removed; global Footer component is rendered in AppShell */}
    </div>
  );
};

export default Home;
