"use client"

import { useState, useEffect } from "react"
import useAuth from "../../hooks/useAuth"
import { useNavigate } from "react-router-dom"
import { adminAPI } from "../../services/api"

const AdminDashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("users")
  const [users, setUsers] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showAddUserForm, setShowAddUserForm] = useState(false)
  const [showAddCourseForm, setShowAddCourseForm] = useState(false)
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
  })
  const [newCourse, setNewCourse] = useState({
    name: "",
    code: "",
    description: "",
    teacherId: "",
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        if (activeTab === "users") {
          const response = await adminAPI.getUsers()
          setUsers(response.users || [])
        } else if (activeTab === "courses") {
          const response = await adminAPI.getCourses()
          setCourses(response.courses || [])
        }

        setLoading(false)
      } catch (err) {
        console.error(`Error fetching ${activeTab}:`, err)
        setError(`Failed to load ${activeTab}. Please try again later.`)
        setLoading(false)
      }
    }

    fetchData()
  }, [activeTab])

  const handleUserInputChange = (e) => {
    const { name, value } = e.target
    setNewUser((prev) => ({ ...prev, [name]: value }))
  }

  const handleCourseInputChange = (e) => {
    const { name, value } = e.target
    setNewCourse((prev) => ({ ...prev, [name]: value }))
  }

  const handleAddUser = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      await adminAPI.createUser(newUser)

      // Refresh user list
      const response = await adminAPI.getUsers()
      setUsers(response.users || [])

      // Reset form
      setNewUser({
        name: "",
        email: "",
        password: "",
        role: "student",
      })

      setShowAddUserForm(false)
      setLoading(false)
    } catch (err) {
      console.error("Error adding user:", err)
      setError("Failed to add user. Please try again.")
      setLoading(false)
    }
  }

  const handleAddCourse = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      await adminAPI.createCourse(newCourse)

      // Refresh course list
      const response = await adminAPI.getCourses()
      setCourses(response.courses || [])

      // Reset form
      setNewCourse({
        name: "",
        code: "",
        description: "",
        teacherId: "",
      })

      setShowAddCourseForm(false)
      setLoading(false)
    } catch (err) {
      console.error("Error adding course:", err)
      setError("Failed to add course. Please try again.")
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        setLoading(true)
        await adminAPI.deleteUser(userId)

        // Refresh user list
        const response = await adminAPI.getUsers()
        setUsers(response.users || [])

        setLoading(false)
      } catch (err) {
        console.error("Error deleting user:", err)
        setError("Failed to delete user. Please try again.")
        setLoading(false)
      }
    }
  }

  const handleDeleteCourse = async (courseId) => {
    if (window.confirm("Are you sure you want to delete this course?")) {
      try {
        setLoading(true)
        await adminAPI.deleteCourse(courseId)

        // Refresh course list
        const response = await adminAPI.getCourses()
        setCourses(response.courses || [])

        setLoading(false)
      } catch (err) {
        console.error("Error deleting course:", err)
        setError("Failed to delete course. Please try again.")
        setLoading(false)
      }
    }
  }

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <div className="dashboard">
      <header>
        <h1>Admin Dashboard</h1>
        <div>
          <p>Welcome, {user?.name}</p>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <div className="dashboard-tabs">
        <button className={activeTab === "users" ? "active" : ""} onClick={() => setActiveTab("users")}>
          Users
        </button>
        <button className={activeTab === "courses" ? "active" : ""} onClick={() => setActiveTab("courses")}>
          Courses
        </button>
      </div>

      <main>
        {activeTab === "users" && (
          <section className="user-management">
            <div className="section-header">
              <h2>User Management</h2>
              <button className="action-button" onClick={() => setShowAddUserForm(!showAddUserForm)}>
                {showAddUserForm ? "Cancel" : "Add User"}
              </button>
            </div>

            {showAddUserForm && (
              <form className="add-form" onSubmit={handleAddUser}>
                <h3>Add New User</h3>

                <div className="form-group">
                  <label>Name</label>
                  <input type="text" name="name" value={newUser.name} onChange={handleUserInputChange} required />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input type="email" name="email" value={newUser.email} onChange={handleUserInputChange} required />
                </div>

                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    name="password"
                    value={newUser.password}
                    onChange={handleUserInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Role</label>
                  <select name="role" value={newUser.role} onChange={handleUserInputChange} required>
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="management">Management</option>
                  </select>
                </div>

                <div className="form-actions">
                  <button type="submit" disabled={loading}>
                    {loading ? "Adding..." : "Add User"}
                  </button>
                </div>
              </form>
            )}

            <div className="content-container">
              {loading ? (
                <div className="spinner"></div>
              ) : users.length > 0 ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>{user.role}</td>
                        <td>
                          <button className="small-button">Edit</button>
                          <button className="small-button danger" onClick={() => handleDeleteUser(user.id)}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No users found.</p>
              )}
            </div>
          </section>
        )}

        {activeTab === "courses" && (
          <section className="course-management">
            <div className="section-header">
              <h2>Course Management</h2>
              <button className="action-button" onClick={() => setShowAddCourseForm(!showAddCourseForm)}>
                {showAddCourseForm ? "Cancel" : "Add Course"}
              </button>
            </div>

            {showAddCourseForm && (
              <form className="add-form" onSubmit={handleAddCourse}>
                <h3>Add New Course</h3>

                <div className="form-group">
                  <label>Course Name</label>
                  <input type="text" name="name" value={newCourse.name} onChange={handleCourseInputChange} required />
                </div>

                <div className="form-group">
                  <label>Course Code</label>
                  <input type="text" name="code" value={newCourse.code} onChange={handleCourseInputChange} required />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea name="description" value={newCourse.description} onChange={handleCourseInputChange} />
                </div>

                <div className="form-group">
                  <label>Teacher ID</label>
                  <input type="text" name="teacherId" value={newCourse.teacherId} onChange={handleCourseInputChange} />
                </div>

                <div className="form-actions">
                  <button type="submit" disabled={loading}>
                    {loading ? "Adding..." : "Add Course"}
                  </button>
                </div>
              </form>
            )}

            <div className="content-container">
              {loading ? (
                <div className="spinner"></div>
              ) : courses.length > 0 ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Code</th>
                      <th>Teacher</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.map((course) => (
                      <tr key={course.id}>
                        <td>{course.name}</td>
                        <td>{course.code}</td>
                        <td>{course.teacherName || "Not assigned"}</td>
                        <td>
                          <button className="small-button">Edit</button>
                          <button className="small-button danger" onClick={() => handleDeleteCourse(course.id)}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No courses found.</p>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

export default AdminDashboard
