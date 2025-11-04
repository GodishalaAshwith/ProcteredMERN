import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false); // mobile menu
  const navigate = useNavigate();

  useEffect(() => {
    const sync = () => {
      const storedUser = localStorage.getItem("user");
      setUser(storedUser ? JSON.parse(storedUser) : null);
    };
    // initial
    sync();
    // listen for custom updates
    window.addEventListener("user-updated", sync);
    // optional: listen to storage for multi-tab sync
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("user-updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    window.dispatchEvent(new Event("user-updated"));
    navigate("/login"); // Redirect to login after logout
  };

  return (
    <nav className="bg-slate-900 text-slate-100 border-b border-slate-800 sticky top-0 z-40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="h-14 md:h-16 flex items-center justify-between">
          <Link
            to="/"
            className="text-2xl sm:text-3xl font-bold tracking-wide hover:text-emerald-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded"
          >
            ProcTesting
          </Link>
          <button
            className="md:hidden inline-flex items-center justify-center p-2 rounded-lg hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-6 h-6"
            >
              {open ? (
                <path
                  fillRule="evenodd"
                  d="M6.225 4.811a1 1 0 0 1 1.414 0L12 9.172l4.361-4.361a1 1 0 1 1 1.414 1.414L13.414 10.586l4.361 4.361a1 1 0 0 1-1.414 1.414L12 12l-4.361 4.361a1 1 0 1 1-1.414-1.414l4.361-4.361-4.361-4.361a1 1 0 0 1 0-1.414Z"
                  clipRule="evenodd"
                />
              ) : (
                <path
                  fillRule="evenodd"
                  d="M3.75 5.25a.75.75 0 0 1 .75-.75h15a.75.75 0 0 1 0 1.5H4.5a.75.75 0 0 1-.75-.75Zm0 6a.75.75 0 0 1 .75-.75h15a.75.75 0 0 1 0 1.5H4.5a.75.75 0 0 1-.75-.75Zm0 6a.75.75 0 0 1 .75-.75h15a.75.75 0 0 1 0 1.5H4.5a.75.75 0 0 1-.75-.75Z"
                  clipRule="evenodd"
                />
              )}
            </svg>
          </button>
          <div className="hidden md:flex items-center gap-2 lg:gap-3">
            <Link
              to="/"
              className="px-3 py-2 rounded-lg hover:bg-emerald-600/15 hover:text-emerald-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              Home
            </Link>
            <Link
              to="/contactus"
              className="px-3 py-2 rounded-lg hover:bg-emerald-600/15 hover:text-emerald-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              Contact
            </Link>

            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="px-3 py-2 rounded-lg hover:bg-emerald-600/15 hover:text-emerald-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  Dashboard
                </Link>
                {user.role === "faculty" && (
                  <Link
                    to="/faculty/exams"
                    className="px-3 py-2 rounded-lg hover:bg-emerald-600/15 hover:text-emerald-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  >
                    Exams
                  </Link>
                )}
                {user.role === "student" && (
                  <>
                    <Link
                      to="/exams"
                      className="px-3 py-2 rounded-lg hover:bg-emerald-600/15 hover:text-emerald-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    >
                      Exams
                    </Link>
                    <Link
                      to="/student/profile"
                      className="px-3 py-2 rounded-lg hover:bg-emerald-600/15 hover:text-emerald-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    >
                      Profile
                    </Link>
                  </>
                )}
                {user.role === "admin" && (
                  <>
                    <Link
                      to="/admin/faculty"
                      className="px-3 py-2 rounded-lg hover:bg-emerald-600/15 hover:text-emerald-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    >
                      Faculty
                    </Link>
                    <Link
                      to="/admin/users"
                      className="px-3 py-2 rounded-lg hover:bg-emerald-600/15 hover:text-emerald-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    >
                      Users
                    </Link>
                    <Link
                      to="/admin/students/upload"
                      className="px-3 py-2 rounded-lg hover:bg-emerald-600/15 hover:text-emerald-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    >
                      Students
                    </Link>
                  </>
                )}
                <button
                  onClick={handleLogout}
                  className="ml-1 bg-emerald-600 hover:bg-emerald-500 text-slate-900 font-semibold px-3 py-2 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3 py-2 rounded-lg hover:bg-emerald-600/15 hover:text-emerald-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-2 rounded-lg bg-emerald-600 text-slate-900 font-semibold hover:bg-emerald-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={`md:hidden transition-all duration-200 ${
            open ? "max-h-[480px] opacity-100" : "max-h-0 opacity-0"
          } overflow-hidden`}
        >
          <div className="pt-3 pb-3 flex flex-col gap-1">
            <Link
              to="/"
              onClick={() => setOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-emerald-600/15 hover:text-emerald-300 transition-colors"
            >
              Home
            </Link>
            <Link
              to="/contactus"
              onClick={() => setOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-emerald-600/15 hover:text-emerald-300 transition-colors"
            >
              Contact
            </Link>
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setOpen(false)}
                  className="px-3 py-2 rounded-lg hover:bg-emerald-600/15 hover:text-emerald-300 transition-colors"
                >
                  Dashboard
                </Link>
                {user.role === "faculty" && (
                  <Link
                    to="/faculty/exams"
                    onClick={() => setOpen(false)}
                    className="px-3 py-2 rounded-lg hover:bg-emerald-600/15 hover:text-emerald-300 transition-colors"
                  >
                    Exams
                  </Link>
                )}
                {user.role === "student" && (
                  <>
                    <Link
                      to="/exams"
                      onClick={() => setOpen(false)}
                      className="px-3 py-2 rounded-lg hover:bg-emerald-600/15 hover:text-emerald-300 transition-colors"
                    >
                      Exams
                    </Link>
                    <Link
                      to="/student/profile"
                      onClick={() => setOpen(false)}
                      className="px-3 py-2 rounded-lg hover:bg-emerald-600/15 hover:text-emerald-300 transition-colors"
                    >
                      Profile
                    </Link>
                  </>
                )}
                {user.role === "admin" && (
                  <>
                    <Link
                      to="/admin/faculty"
                      onClick={() => setOpen(false)}
                      className="px-3 py-2 rounded-lg hover:bg-emerald-600/15 hover:text-emerald-300 transition-colors"
                    >
                      Faculty
                    </Link>
                    <Link
                      to="/admin/users"
                      onClick={() => setOpen(false)}
                      className="px-3 py-2 rounded-lg hover:bg-emerald-600/15 hover:text-emerald-300 transition-colors"
                    >
                      Users
                    </Link>
                    <Link
                      to="/admin/students/upload"
                      onClick={() => setOpen(false)}
                      className="px-3 py-2 rounded-lg hover:bg-emerald-600/15 hover:text-emerald-300 transition-colors"
                    >
                      Students
                    </Link>
                  </>
                )}
                <button
                  onClick={() => {
                    setOpen(false);
                    handleLogout();
                  }}
                  className="mt-1 bg-emerald-600 hover:bg-emerald-500 text-slate-900 font-semibold px-3 py-2 rounded-lg transition-colors text-left"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="px-3 py-2 rounded-lg hover:bg-emerald-600/15 hover:text-emerald-300 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setOpen(false)}
                  className="px-3 py-2 rounded-lg bg-emerald-600 text-slate-900 font-semibold hover:bg-emerald-500 transition-colors"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
