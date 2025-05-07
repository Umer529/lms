"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import useAuth from "../hooks/useAuth"
import "./login.css"

const Login = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const navigate = useNavigate()
  const { login } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Basic validation
    if (!email || !password) {
      setError("Please enter both email and password")
      setIsLoading(false)
      return
    }

    try {
      // Call login function from AuthContext
      //const result ;//= await login(email, password)
      //result.success = true;
      const result = { success: true, user: { role: "student" } }
      if (result.success) {
        // Redirect based on role
       // result.user.role = "student";
        switch (result.user.role) {
          case "student":
            navigate("../dashboards/student-dashboard")
            break
          case "teacher":
            navigate("/teacher")
            break
          case "management":
            navigate("/admin")
            break
          default:
            navigate("/")
        }
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError("Login failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="login-wrapper">
      <div className="login-container">
        <div className="login-header">
          <h2>Welcome to LMS</h2>
          <p>Please log in to access your account</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder=" "
              required
            />
            <label htmlFor="email">Email</label>
          </div>

          <div className="input-group">
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder=" "
              required
            />
            <label htmlFor="password">Password</label>
          </div>

          <button type="submit" disabled={isLoading} className={isLoading ? "loading" : ""}>
            {isLoading ? (
              <>
                <span className="spinner"></span> Logging in...
              </>
            ) : (
              "Login"
            )}
          </button>
        </form>

        {error && <p className="error-message">{error}</p>}

        <div className="login-footer">
          <p>
            Forgot password? <a href="/forgot-password">Click here</a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
