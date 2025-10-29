import React, { useEffect, useState } from "react";
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
    <nav className="bg-indigo-600 text-white shadow-lg p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link
          to="/"
          className="text-3xl font-bold tracking-wide hover:text-indigo-300 transition duration-300"
        >
          CourseCred
        </Link>

        <div className="space-x-6 flex items-center">
          <Link
            to="/"
            className="hover:bg-indigo-500 px-4 py-2 rounded-lg transition duration-300"
          >
            Home
          </Link>
          <Link
            to="/contactus"
            className="hover:bg-indigo-500 px-4 py-2 rounded-lg transition duration-300"
          >
            Contact
          </Link>

          {user ? (
            <>
              <Link
                to="/dashboard"
                className="hover:bg-indigo-500 px-4 py-2 rounded-lg transition duration-300"
              >
                Dashboard
              </Link>
              {user.role === "faculty" && (
                <Link
                  to="/faculty/exams"
                  className="hover:bg-indigo-500 px-4 py-2 rounded-lg transition duration-300"
                >
                  Exams
                </Link>
              )}
              {user.role === "student" && (
                <>
                  <Link
                    to="/exams"
                    className="hover:bg-indigo-500 px-4 py-2 rounded-lg transition duration-300"
                  >
                    Exams
                  </Link>
                  <Link
                    to="/student/profile"
                    className="hover:bg-indigo-500 px-4 py-2 rounded-lg transition duration-300"
                  >
                    Profile
                  </Link>
                </>
              )}
              {user.role === "admin" && (
                <Link
                  to="/admin/faculty"
                  className="hover:bg-indigo-500 px-4 py-2 rounded-lg transition duration-300"
                >
                  Faculty
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg font-semibold transition duration-300"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="hover:bg-indigo-500 px-4 py-2 rounded-lg transition duration-300"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="hover:bg-indigo-500 px-4 py-2 rounded-lg transition duration-300"
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
