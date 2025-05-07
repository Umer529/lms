"use client"

import { createContext, useState, useEffect } from "react"
import axios from "axios"

export const AuthContext = createContext()

// API base URL - should match your backend server
const API_URL = "http://localhost:5000/api"

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user data exists in localStorage on component mount
    const storedUser = localStorage.getItem("user")
    const token = localStorage.getItem("token")

    if (storedUser && token) {
      setUser(JSON.parse(storedUser))

      // Set default authorization header for all requests
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`
    }

    setIsLoading(false)
  }, [])

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      })

      const { token, user } = response.data

      // Store user data and token in localStorage
      localStorage.setItem("user", JSON.stringify(user))
      localStorage.setItem("token", token)

      // Set default authorization header for all requests
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`

      setUser(user)
      return { success: true, user }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Login failed",
      }
    }
  }

  const logout = () => {
    localStorage.removeItem("user")
    localStorage.removeItem("token")
    delete axios.defaults.headers.common["Authorization"]
    setUser(null)
    // Redirect will be handled by the component using this function
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>{!isLoading && children}</AuthContext.Provider>
  )
}
