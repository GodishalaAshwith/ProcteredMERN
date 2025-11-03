import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const Navbar = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login"); // Redirect to login after logout
  };

  return (
    <nav className="bg-slate-900 text-slate-100 border-b border-slate-800">
      <div className="container mx-auto flex justify-between items-center px-4 py-3">
        <Link
          to="/"
          className="text-2xl sm:text-3xl font-bold tracking-wide hover:text-emerald-400 transition-colors"
        >
          ProcTesting
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/"
            className="px-3 py-2 rounded-lg hover:bg-emerald-600/15 hover:text-emerald-300 transition-colors"
          >
            Home
          </Link>
          <Link
            to="/contactus"
            className="px-3 py-2 rounded-lg hover:bg-emerald-600/15 hover:text-emerald-300 transition-colors"
          >
            Contact
          </Link>

          {user ? (
            <>
              <Link
                to="/dashboard"
                className="px-3 py-2 rounded-lg hover:bg-emerald-600/15 hover:text-emerald-300 transition-colors"
              >
                Dashboard
              </Link>
              {user.role === "faculty" && (
                <Link
                  to="/faculty/exams"
                  className="px-3 py-2 rounded-lg hover:bg-emerald-600/15 hover:text-emerald-300 transition-colors"
                >
                  Exams
                </Link>
              )}
              {user.role === "student" && (
                <>
                  <Link
                    to="/exams"
                    className="px-3 py-2 rounded-lg hover:bg-emerald-600/15 hover:text-emerald-300 transition-colors"
                  >
                    Exams
                  </Link>
                  <Link
                    to="/student/profile"
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
                    className="px-3 py-2 rounded-lg hover:bg-emerald-600/15 hover:text-emerald-300 transition-colors"
                  >
                    Faculty
                  </Link>
                  <Link
                    to="/admin/users"
                    className="px-3 py-2 rounded-lg hover:bg-emerald-600/15 hover:text-emerald-300 transition-colors"
                  >
                    Users
                  </Link>
                  <Link
                    to="/admin/students/upload"
                    className="px-3 py-2 rounded-lg hover:bg-emerald-600/15 hover:text-emerald-300 transition-colors"
                  >
                    Students
                  </Link>
                </>
              )}
              <button
                onClick={handleLogout}
                className="ml-1 bg-emerald-600 hover:bg-emerald-500 text-slate-900 font-semibold px-3 py-2 rounded-lg transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-3 py-2 rounded-lg hover:bg-emerald-600/15 hover:text-emerald-300 transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-3 py-2 rounded-lg bg-emerald-600 text-slate-900 font-semibold hover:bg-emerald-500 transition-colors"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
