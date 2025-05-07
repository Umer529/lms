"use client"

import { useState, useEffect } from "react"
import useAuth from "../../hooks/useAuth"
import { useNavigate } from "react-router-dom"
import { studentAPI } from "../../services/api"

const StudentDashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [courses, setCourses] = useState([])
  const [grades, setGrades] = useState([])
  const [attendance, setAttendance] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("courses")

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Fetch courses
        const coursesData = await studentAPI.getCourses()
        setCourses(coursesData.courses || [])

        // Fetch grades
        const gradesData = await studentAPI.getGrades()
        setGrades(gradesData.grades || [])

        // Fetch attendance
        const attendanceData = await studentAPI.getAttendance()
        setAttendance(attendanceData.attendance || [])
        setStats(attendanceData.stats || {})

        setLoading(false)
      } catch (err) {
        console.error("Error fetching data:", err)
        setError("Failed to load data. Please try again later.")
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  if (loading) {
    return (
      <div className="dashboard">
        <header>
          <h1>Student Dashboard</h1>
          <div>
            <p>Welcome, {user?.name}</p>
            <button onClick={handleLogout}>Logout</button>
          </div>
        </header>
        <div className="loading-container">
          <div className="spinner-large"></div>
          <p>Loading your data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <header>
        <h1>Student Dashboard</h1>
        <div>
          <p>Welcome, {user?.name}</p>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <div className="dashboard-tabs">
        <button className={activeTab === "courses" ? "active" : ""} onClick={() => setActiveTab("courses")}>
          My Courses
        </button>
        <button className={activeTab === "grades" ? "active" : ""} onClick={() => setActiveTab("grades")}>
          Grades
        </button>
        <button className={activeTab === "attendance" ? "active" : ""} onClick={() => setActiveTab("attendance")}>
          Attendance
        </button>
      </div>

      <main>
        {activeTab === "courses" && (
          <section className="courses">
            <h2>My Courses</h2>
            <div className="content-container">
              {courses.length > 0 ? (
                <div className="course-list">
                  {courses.map((course) => (
                    <div key={course.id} className="course-card">
                      <h3>{course.name}</h3>
                      <p>Code: {course.code}</p>
                      <p>Status: {course.status}</p>
                      <p>Progress: {course.progress || "0%"}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p>You are not enrolled in any courses yet.</p>
              )}
            </div>
          </section>
        )}

        {activeTab === "grades" && (
          <section className="grades">
            <h2>Your Grades</h2>
            <div className="content-container">
              {grades.length > 0 ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Course</th>
                      <th>Assignment</th>
                      <th>Grade</th>
                      <th>Feedback</th>
                      <th>Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grades.map((grade) => (
                      <tr key={grade.id}>
                        <td>
                          {grade.courseName} ({grade.courseCode})
                        </td>
                        <td>{grade.assignmentTitle}</td>
                        <td>{grade.grade || "Not graded"}</td>
                        <td>{grade.feedback || "-"}</td>
                        <td>{new Date(grade.submittedAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No grades available yet.</p>
              )}
            </div>
          </section>
        )}

        {activeTab === "attendance" && (
          <section className="attendance">
            <h2>Attendance</h2>
            <div className="content-container">
              <div className="attendance-summary">
                <div className="attendance-stat">
                  <span className="stat-value">{stats.presentPercentage?.toFixed(1) || 0}%</span>
                  <span className="stat-label">Present</span>
                </div>
                <div className="attendance-stat">
                  <span className="stat-value">{stats.absentPercentage?.toFixed(1) || 0}%</span>
                  <span className="stat-label">Absent</span>
                </div>
                <div className="attendance-stat">
                  <span className="stat-value">{stats.totalClasses || 0}</span>
                  <span className="stat-label">Total Classes</span>
                </div>
              </div>

              {attendance.length > 0 ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Course</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map((record) => (
                      <tr key={record.id}>
                        <td>
                          {record.courseName} ({record.courseCode})
                        </td>
                        <td>{new Date(record.date).toLocaleDateString()}</td>
                        <td className={`status-${record.status.toLowerCase()}`}>{record.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No attendance records available yet.</p>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

export default StudentDashboard
