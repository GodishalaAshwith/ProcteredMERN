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
        className="min-h-[80vh] sm:h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-800 text-white text-center flex flex-col items-center justify-center px-6"
        data-aos="fade-up"
      >
        <h1 className="text-4xl sm:text-6xl font-extrabold leading-tight max-w-4xl">
          Secure, Fair, and Scalable Proctored Testing
        </h1>
        <p className="text-base sm:text-xl max-w-3xl mx-auto mt-4 text-slate-200">
          ProcTesting helps institutions create, deliver, and proctor online
          exams with AI assistance, identity checks, and robust integrity
          signals.
        </p>
        {localStorage.getItem("token") ? (
          <Link
            to="/dashboard"
            className="mt-6 px-6 sm:px-8 py-3 bg-emerald-500 text-slate-900 font-semibold rounded-full shadow-lg hover:bg-emerald-400 transition-colors text-base sm:text-lg"
          >
            Go to Dashboard
          </Link>
        ) : (
          <Link
            to="/register"
            className="mt-6 px-6 sm:px-8 py-3 bg-emerald-500 text-slate-900 font-semibold rounded-full shadow-lg hover:bg-emerald-400 transition-colors text-base sm:text-lg"
          >
            Get Started
          </Link>
        )}
      </section>

      {/* How It Works */}
      <section className="min-h-[70vh] flex flex-col justify-center items-center text-center px-6 py-16">
        <h2
          className="text-3xl sm:text-5xl font-bold mb-12 text-slate-800"
          data-aos="fade-up"
        >
          How It Works
        </h2>
        <div className="grid md:grid-cols-3 gap-6 md:gap-12 max-w-6xl mx-auto">
          {[
            {
              title: "Create Exams",
              desc: "Build question banks, configure timing, and set rules for secure delivery.",
            },
            {
              title: "AI Proctoring",
              desc: "Enable camera, mic, and screen checks with real-time integrity events.",
            },
            {
              title: "Review & Report",
              desc: "Analyze attempts, flag anomalies, and export audit-ready reports.",
            },
          ].map((item, index) => (
            <div
              key={index}
              className="bg-white p-8 sm:p-10 rounded-xl shadow-lg hover:shadow-2xl transition-transform hover:-translate-y-1 border border-slate-200"
              data-aos="fade-up"
              data-aos-anchor-placement="top-bottom"
              data-aos-delay={`${index * 200}`}
            >
              <h3 className="text-2xl font-semibold mb-3 text-emerald-700">
                {item.title}
              </h3>
              <p className="text-slate-600 text-lg">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Highlights */}
      <section
        className="min-h-[70vh] flex flex-col justify-center items-center bg-slate-100 text-center px-6 py-16"
        data-aos="fade-up"
      >
        <h2 className="text-3xl sm:text-5xl font-bold mb-12 text-slate-800">
          Platform Highlights
        </h2>
        <div className="grid md:grid-cols-3 gap-6 md:gap-12 max-w-6xl mx-auto">
          {[
            "Identity verification & session recording",
            "Browser lockdown & tab switch detection",
            "Detailed attempt logs with proctoring events",
          ].map((point, index) => (
            <div
              key={index}
              className="bg-white p-8 sm:p-10 rounded-xl shadow-lg hover:shadow-2xl transition-transform hover:-translate-y-1 border border-slate-200"
              data-aos="fade-up"
              data-aos-anchor-placement="top-bottom"
              data-aos-delay={`${index * 200}`}
            >
              <h3 className="text-2xl font-semibold text-emerald-700">
                {point}
              </h3>
              <p className="text-slate-600 mt-3 text-lg">
                Designed for accessibility, performance, and academic integrity.
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section
        className="min-h-[60vh] flex flex-col justify-center items-center text-center bg-white px-6 py-16"
        data-aos="fade-up"
      >
        <h2 className="text-3xl sm:text-5xl font-bold mb-12 text-slate-800">
          What Institutions Say
        </h2>
        <div
          className="max-w-4xl mx-auto p-8 sm:p-10 bg-slate-100 rounded-xl shadow-lg border border-slate-200"
          data-aos="fade-up"
          data-aos-anchor-placement="top-bottom"
        >
          <p className="text-lg sm:text-xl italic text-slate-700">
            &ldquo;ProcTesting streamlines our online assessments while
            maintaining fairness and trust. The reporting saved our team hours
            per exam.&rdquo;
          </p>
          <p className="mt-6 font-semibold text-emerald-700 text-lg">
            - Program Director, State University
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-100 text-center py-8 relative z-10">
        <p className="text-lg font-light">
          &copy; 2025 ProcTesting | Secure, fair, and scalable assessments
        </p>
        <p className="text-sm text-slate-400 mt-2">
          Done by{" "}
          <a
            href="https://in.linkedin.com/in/ashwithg"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 font-medium hover:underline"
          >
            Ashwith Godishala
          </a>
        </p>
      </footer>
    </div>
  );
};

export default Home;
