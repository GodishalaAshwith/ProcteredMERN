import React from "react";

const Footer = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-slate-900 text-slate-100 border-t border-slate-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm sm:text-base text-slate-300 text-center sm:text-left">
            ProcTesting — Proctored Exams (MERN)
          </p>
          <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-end">
            <span className="text-xs sm:text-sm text-slate-400">
              Done by{" "}
              <a
                href="https://in.linkedin.com/in/ashwithg"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-300 hover:underline"
              >
                Ashwith Godishala
              </a>
            </span>
            <a
              href="https://github.com/GodishalaAshwith"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub Profile"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              title="GitHub"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-5 w-5 text-slate-200"
              >
                <path
                  fillRule="evenodd"
                  d="M12 .5C5.648.5.5 5.648.5 12c0 5.086 3.292 9.395 7.863 10.917.575.105.787-.25.787-.557 0-.275-.01-1.002-.016-1.967-3.199.696-3.875-1.543-3.875-1.543-.523-1.327-1.277-1.68-1.277-1.68-1.044-.714.08-.699.08-.699 1.154.081 1.762 1.186 1.762 1.186 1.026 1.76 2.692 1.253 3.346.958.104-.744.402-1.253.73-1.541-2.554-.29-5.238-1.277-5.238-5.684 0-1.255.45-2.28 1.186-3.085-.119-.29-.514-1.458.112-3.04 0 0 .967-.31 3.17 1.179.92-.256 1.905-.384 2.886-.389.981.005 1.967.133 2.887.389 2.202-1.49 3.168-1.179 3.168-1.179.628 1.582.233 2.75.114 3.04.737.805 1.184 1.83 1.184 3.085 0 4.418-2.69 5.39-5.254 5.675.413.356.78 1.056.78 2.128 0 1.537-.014 2.777-.014 3.156 0 .31.208.67.794.556C20.21 21.393 23.5 17.085 23.5 12 23.5 5.648 18.352.5 12 .5Z"
                  clipRule="evenodd"
                />
              </svg>
            </a>
            <a
              href="https://in.linkedin.com/in/ashwithg"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn Profile"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              title="LinkedIn"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-5 w-5 text-slate-200"
              >
                <path d="M4.983 3.5C4.983 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.114 1 2.5 1s2.483 1.12 2.483 2.5zM.28 8.229h4.44V24H.28zM8.106 8.229h4.258v2.143h.06c.593-1.123 2.041-2.307 4.202-2.307 4.49 0 5.318 2.953 5.318 6.794V24h-4.636v-6.806c0-1.624-.03-3.714-2.262-3.714-2.264 0-2.612 1.767-2.612 3.595V24H8.106z" />
              </svg>
            </a>
          </div>
        </div>
        <p className="mt-2 text-center text-xs text-slate-500">
          &copy; {year} • Built with React, Node.js/Express, and MongoDB
        </p>
      </div>
    </footer>
  );
};

export default Footer;
