"use client"

import { useNavigate } from "react-router-dom"

const Unauthorized = () => {
  const navigate = useNavigate()

  return (
    <div className="unauthorized">
      <h1>403 - Unauthorized Access</h1>
      <p>You don't have permission to view this page.</p>
      <button onClick={() => navigate(-1)}>Go Back</button>
      <button onClick={() => navigate("/login")}>Login</button>
    </div>
  )
}

export default Unauthorized
