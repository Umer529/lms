import axios from "axios"

const API_URL = "http://localhost:5000/api"

// Configure axios defaults
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Handle token expiration or unauthorized access
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Token expired or invalid
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      window.location.href = "/login"
    }
    return Promise.reject(error)
  },
)

// Student API calls
export const studentAPI = {
  getCourses: async () => {
    const response = await axios.get(`${API_URL}/student/courses`)
    return response.data
  },

  getGrades: async () => {
    const response = await axios.get(`${API_URL}/student/grades`)
    return response.data
  },

  getAttendance: async () => {
    const response = await axios.get(`${API_URL}/student/attendance`)
    return response.data
  },
}

// Teacher API calls
export const teacherAPI = {
  getCourses: async () => {
    const response = await axios.get(`${API_URL}/teacher/courses`)
    return response.data
  },

  getCourseStudents: async (courseId) => {
    const response = await axios.get(`${API_URL}/teacher/courses/${courseId}/students`)
    return response.data
  },

  updateGrade: async (gradeId, gradeData) => {
    const response = await axios.put(`${API_URL}/teacher/grades/${gradeId}`, gradeData)
    return response.data
  },

  takeAttendance: async (courseId, attendanceData) => {
    const response = await axios.post(`${API_URL}/teacher/courses/${courseId}/attendance`, attendanceData)
    return response.data
  },
}

// Admin API calls
export const adminAPI = {
  getUsers: async () => {
    const response = await axios.get(`${API_URL}/admin/users`)
    return response.data
  },

  createUser: async (userData) => {
    const response = await axios.post(`${API_URL}/admin/users`, userData)
    return response.data
  },

  updateUser: async (userId, userData) => {
    const response = await axios.put(`${API_URL}/admin/users/${userId}`, userData)
    return response.data
  },

  deleteUser: async (userId) => {
    const response = await axios.delete(`${API_URL}/admin/users/${userId}`)
    return response.data
  },

  getCourses: async () => {
    const response = await axios.get(`${API_URL}/admin/courses`)
    return response.data
  },

  createCourse: async (courseData) => {
    const response = await axios.post(`${API_URL}/admin/courses`, courseData)
    return response.data
  },

  updateCourse: async (courseId, courseData) => {
    const response = await axios.put(`${API_URL}/admin/courses/${courseId}`, courseData)
    return response.data
  },

  deleteCourse: async (courseId) => {
    const response = await axios.delete(`${API_URL}/admin/courses/${courseId}`)
    return response.data
  },
}
