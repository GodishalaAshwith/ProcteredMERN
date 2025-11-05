import { useEffect, useState } from "react";
import { Github, Linkedin, Mail, UserRound } from "lucide-react";
import { sendContactMessage } from "../utils/api";
import AOS from "aos";
import "aos/dist/aos.css";

const ContactUs = () => {
  useEffect(() => {
    AOS.init({ duration: 1000, once: false, mirror: true });
  }, []);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState({ type: null, message: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;
    setSubmitting(true);
    setStatus({ type: null, message: "" });
    try {
      await sendContactMessage({ ...formData });
      setStatus({ type: "success", message: "Message sent successfully." });
      setFormData({ name: "", email: "", message: "" });
    } catch (err) {
      const msg = err?.response?.data?.error || "Failed to send message";
      setStatus({ type: "error", message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-50 font-sans min-h-[70vh] py-10">
      <div className="max-w-6xl mx-auto px-4">
        <header className="mb-8" data-aos="fade-up">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Get in touch
          </h1>
          <p className="text-slate-600 mt-1">
            Questions, feedback, or ideas? Drop a message — I usually reply
            within a day.
          </p>
        </header>

        <div
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
          data-aos="fade-up"
        >
          {/* Left: Developer intro */}
          <section className="bg-white p-6 rounded-xl shadow border border-slate-200">
            <div className="flex items-start gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                  <UserRound className="h-5 w-5 text-emerald-600" /> Know the
                  Developer
                </h2>
                <p className="text-slate-600 mt-2">
                  Hi, I'm the developer behind this proctored examination
                  platform. I love building reliable, accessible apps with a
                  focus on smooth user experience, performance, and security. If
                  you have feedback, feature requests, or collaboration ideas,
                  I’d love to hear from you.
                </p>
              </div>
            </div>

            <dl className="mt-5 space-y-3 text-slate-700">
              <div className="flex items-center gap-2">
                <dt className="font-semibold w-20">Name</dt>
                <dd>Godishala Ashwith</dd>
              </div>
              <div className="flex items-center gap-2">
                <dt className="font-semibold w-20">Email</dt>
                <dd className="inline-flex items-center gap-2">
                  <Mail className="h-4 w-4 text-emerald-600" />
                  <a
                    href="mailto:ashwithgodishala.work@gmail.com"
                    className="underline decoration-emerald-400 underline-offset-2 hover:text-emerald-700"
                  >
                    ashwithgodishala.work@gmail.com
                  </a>
                </dd>
              </div>
            </dl>

            <div className="mt-4 flex items-center gap-3">
              <a
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-slate-800 transition-colors"
                href="https://github.com/GodishalaAshwith"
                target="_blank"
                rel="noreferrer"
                aria-label="Open GitHub profile in new tab"
              >
                <Github className="h-4 w-4 text-slate-700" /> GitHub
              </a>
              <a
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-slate-800 transition-colors"
                href="https://www.linkedin.com/in/ashwithg"
                target="_blank"
                rel="noreferrer"
                aria-label="Open LinkedIn profile in new tab"
              >
                <Linkedin className="h-4 w-4 text-blue-700" /> LinkedIn
              </a>
            </div>
          </section>

          {/* Right: Contact form */}
          <section className="bg-white p-6 rounded-xl shadow border border-slate-200">
            <h2 className="text-xl font-semibold text-slate-900">Contact Us</h2>
            {status.type && (
              <div
                className={`${
                  status.type === "success"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-red-50 text-red-700 border-red-200"
                } border rounded-lg px-3 py-2 text-sm mt-3`}
              >
                {status.message}
              </div>
            )}
            <form onSubmit={handleSubmit} className="mt-4 space-y-4" noValidate>
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-slate-700"
                >
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  placeholder="e.g., Jane Doe"
                  value={formData.name}
                  onChange={handleChange}
                  className="mt-1 w-full px-4 py-3 border border-slate-200 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                  aria-required="true"
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-slate-700"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-1 w-full px-4 py-3 border border-slate-200 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                  aria-required="true"
                />
              </div>
              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-slate-700"
                >
                  Your Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  placeholder="How can I help?"
                  value={formData.message}
                  onChange={handleChange}
                  className="mt-1 w-full px-4 py-3 border border-slate-200 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  rows="5"
                  required
                  aria-required="true"
                ></textarea>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className={`w-full py-3 rounded-lg font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                  submitting
                    ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                    : "bg-emerald-600 text-slate-900 hover:bg-emerald-500"
                }`}
              >
                {submitting ? "Sending…" : "Send Message"}
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
