import { Routes, Route, Navigate } from "react-router-dom"
import Login from "./MyComponents/Login"
import StudentDashboard from "./MyComponents/dashboards/student-dashboard"
import TeacherDashboard from "./MyComponents/dashboards/teacher-dashboard"
import AdminDashboard from "./MyComponents/dashboards/admin-dashboard"
import Unauthorized from "./MyComponents/Unauthorized"
import ProtectedRoute from "./MyComponents/ProtectedRoute"
import "./App.css"

const App = () => (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/unauthorized" element={<Unauthorized />} />

    <Route
      path="/student"
      element={
        <ProtectedRoute allowedRoles={["student"]}>
          <StudentDashboard />
        </ProtectedRoute>
      }
    />

    <Route
      path="/teacher"
      element={
        <ProtectedRoute allowedRoles={["teacher"]}>
          <TeacherDashboard />
        </ProtectedRoute>
      }
    />

    <Route
      path="/admin"
      element={
        <ProtectedRoute allowedRoles={["management"]}>
          <AdminDashboard />
        </ProtectedRoute>
      }
    />

    <Route path="*" element={<Navigate to="/login" replace />} />
  </Routes>
)

export default App
