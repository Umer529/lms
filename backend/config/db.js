const sql = require("mssql")
const config = require("./config")

// SQL Server configuration
const sqlConfig = {
  server: "localhost\\SQLEXPRESS",
  database: "LMS2",
  driver: "msnodesqlv8",
  options: {
    trustedConnection: true,
    enableArithAbort: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

// Get connection pool
const getConnection = async () => {
  try {
    // Make sure that the connection is established
    return await sql.connect(sqlConfig)
  } catch (err) {
    console.error("Database connection failed:", err)
    throw err
  }
}

module.exports = {
  getConnection,
  sql,
}
