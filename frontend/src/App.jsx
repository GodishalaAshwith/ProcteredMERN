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
import FacultyExams from "./pages/FacultyExams";
import ExamEditor from "./pages/ExamEditor";
import FacultySubmissions from "./pages/FacultySubmissions";
import StudentExams from "./pages/StudentExams";
import ExamRunner from "./pages/ExamRunner";
import StudentProfile from "./pages/StudentProfile";
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
        <Route
          path="/faculty/exams"
          element={
            <PrivateRoute>
              <RoleRoute allow={["faculty"]}>
                <FacultyExams />
              </RoleRoute>
            </PrivateRoute>
          }
        />
        <Route
          path="/faculty/exams/new"
          element={
            <PrivateRoute>
              <RoleRoute allow={["faculty"]}>
                <ExamEditor />
              </RoleRoute>
            </PrivateRoute>
          }
        />
        <Route
          path="/faculty/exams/:id"
          element={
            <PrivateRoute>
              <RoleRoute allow={["faculty"]}>
                <ExamEditor />
              </RoleRoute>
            </PrivateRoute>
          }
        />
        <Route
          path="/faculty/exams/:examId/attempts"
          element={
            <PrivateRoute>
              <RoleRoute allow={["faculty"]}>
                <FacultySubmissions />
              </RoleRoute>
            </PrivateRoute>
          }
        />
        <Route
          path="/exams"
          element={
            <PrivateRoute>
              <RoleRoute allow={["student"]}>
                <StudentExams />
              </RoleRoute>
            </PrivateRoute>
          }
        />
        <Route
          path="/student/profile"
          element={
            <PrivateRoute>
              <RoleRoute allow={["student"]}>
                <StudentProfile />
              </RoleRoute>
            </PrivateRoute>
          }
        />
        <Route
          path="/attempt/:examId"
          element={
            <PrivateRoute>
              <RoleRoute allow={["student"]}>
                <ExamRunner />
              </RoleRoute>
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
