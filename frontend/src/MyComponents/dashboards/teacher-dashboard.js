"use client"

import { useState, useEffect } from "react"
import useAuth from "../../hooks/useAuth"
import { useNavigate } from "react-router-dom"
import { teacherAPI } from "../../services/api"

const TeacherDashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [attendanceMode, setAttendanceMode] = useState(false)
  const [attendanceRecords, setAttendanceRecords] = useState([])

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true)
        const response = await teacherAPI.getCourses()
        setCourses(response.courses || [])
        setLoading(false)
      } catch (err) {
        console.error("Error fetching courses:", err)
        setError("Failed to load courses. Please try again later.")
        setLoading(false)
      }
    }

    fetchCourses()
  }, [])

  const handleCourseSelect = async (courseId) => {
    try {
      setLoading(true)
      setSelectedCourse(courses.find((course) => course.id === courseId))

      const response = await teacherAPI.getCourseStudents(courseId)
      setStudents(response.students || [])

      // Initialize attendance records
      setAttendanceRecords(
        response.students.map((student) => ({
          studentId: student.id,
          status: "present",
        })),
      )

      setLoading(false)
    } catch (err) {
      console.error("Error fetching students:", err)
      setError("Failed to load students. Please try again later.")
      setLoading(false)
    }
  }

  const handleAttendanceChange = (studentId, status) => {
    setAttendanceRecords(
      attendanceRecords.map((record) => (record.studentId === studentId ? { ...record, status } : record)),
    )
  }

  const handleSubmitAttendance = async () => {
    try {
      setLoading(true)
      await teacherAPI.takeAttendance(selectedCourse.id, { attendanceRecords })
      setAttendanceMode(false)
      setLoading(false)
      alert("Attendance recorded successfully")
    } catch (err) {
      console.error("Error recording attendance:", err)
      setError("Failed to record attendance. Please try again.")
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <div className="dashboard">
      <header>
        <h1>Teacher Dashboard</h1>
        <div>
          <p>Welcome, {user?.name}</p>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <main>
        <section className="courses">
          <h2>Your Courses</h2>
          <div className="content-container">
            {loading && !selectedCourse ? (
              <div className="spinner"></div>
            ) : courses.length > 0 ? (
              <div className="course-list">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className={`course-card ${selectedCourse?.id === course.id ? "selected" : ""}`}
                    onClick={() => handleCourseSelect(course.id)}
                  >
                    <h3>{course.name}</h3>
                    <p>Code: {course.code}</p>
                    <p>Students: {course.enrolledStudents || 0}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p>No courses assigned yet.</p>
            )}
          </div>
        </section>

        {selectedCourse && (
          <section className="students">
            <div className="section-header">
              <h2>Students in {selectedCourse.name}</h2>
              {!attendanceMode ? (
                <button className="action-button" onClick={() => setAttendanceMode(true)}>
                  Take Attendance
                </button>
              ) : (
                <div className="button-group">
                  <button className="action-button" onClick={handleSubmitAttendance} disabled={loading}>
                    {loading ? "Saving..." : "Save Attendance"}
                  </button>
                  <button className="action-button secondary" onClick={() => setAttendanceMode(false)}>
                    Cancel
                  </button>
                </div>
              )}
            </div>

            <div className="content-container">
              {loading ? (
                <div className="spinner"></div>
              ) : students.length > 0 ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Enrolled</th>
                      {attendanceMode ? <th>Attendance</th> : <th>Progress</th>}
                      {!attendanceMode && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student.id}>
                        <td>{student.name}</td>
                        <td>{student.email}</td>
                        <td>{new Date(student.enrolledAt).toLocaleDateString()}</td>
                        {attendanceMode ? (
                          <td>
                            <select
                              value={
                                attendanceRecords.find((record) => record.studentId === student.id)?.status || "present"
                              }
                              onChange={(e) => handleAttendanceChange(student.id, e.target.value)}
                            >
                              <option value="present">Present</option>
                              <option value="absent">Absent</option>
                              <option value="excused">Excused</option>
                            </select>
                          </td>
                        ) : (
                          <td>{student.progress || "0%"}</td>
                        )}
                        {!attendanceMode && (
                          <td>
                            <button className="small-button">Grades</button>
                            <button className="small-button">Details</button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No students enrolled in this course.</p>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

export default TeacherDashboard
