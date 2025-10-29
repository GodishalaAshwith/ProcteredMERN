import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ContactUs from "./pages/ContactUs";
import AdminFaculty from "./pages/AdminFaculty";
import Navbar from "./components/Navbar";

const PrivateRoute = ({ children }) =>
  localStorage.getItem("token") ? children : <Navigate to="/login" />;

const RoleRoute = ({ allow, children }) => {
  const stored = localStorage.getItem("user");
  if (!stored) return <Navigate to="/login" />;
  const user = JSON.parse(stored);
  return allow.includes(user.role) ? children : <Navigate to="/" />;
};

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/contactus" element={<ContactUs />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/faculty"
          element={
            <PrivateRoute>
              <RoleRoute allow={["admin"]}>
                <AdminFaculty />
              </RoleRoute>
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
