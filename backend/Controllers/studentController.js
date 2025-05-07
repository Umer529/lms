const { getConnection, sql } = require("../config/db")

// Get student courses
exports.getCourses = async (req, res, next) => {
  try {
    const studentId = req.user.id

    // Get database connection
    const pool = await getConnection()

    // Get courses for student
    const result = await pool
      .request()
      .input("studentId", sql.Int, studentId)
      .query(`
        SELECT c.id, c.name, c.code, c.description, 
               e.progress, e.status
        FROM Courses c
        JOIN Enrollments e ON c.id = e.courseId
        WHERE e.studentId = @studentId
      `)

    res.status(200).json({
      courses: result.recordset,
    })
  } catch (err) {
    next(err)
  }
}

// Get student grades
exports.getGrades = async (req, res, next) => {
  try {
    const studentId = req.user.id

    // Get database connection
    const pool = await getConnection()

    // Get grades for student
    const result = await pool
      .request()
      .input("studentId", sql.Int, studentId)
      .query(`
        SELECT g.id, g.grade, g.feedback, g.submittedAt,
               a.title as assignmentTitle,
               c.name as courseName, c.code as courseCode
        FROM Grades g
        JOIN Assignments a ON g.assignmentId = a.id
        JOIN Courses c ON a.courseId = c.id
        WHERE g.studentId = @studentId
        ORDER BY g.submittedAt DESC
      `)

    res.status(200).json({
      grades: result.recordset,
    })
  } catch (err) {
    next(err)
  }
}

// Get student attendance
exports.getAttendance = async (req, res, next) => {
  try {
    const studentId = req.user.id

    // Get database connection
    const pool = await getConnection()

    // Get attendance for student
    const result = await pool
      .request()
      .input("studentId", sql.Int, studentId)
      .query(`
        SELECT a.id, a.date, a.status,
               c.name as courseName, c.code as courseCode
        FROM Attendance a
        JOIN Courses c ON a.courseId = c.id
        WHERE a.studentId = @studentId
        ORDER BY a.date DESC
      `)

    // Calculate attendance statistics
    const totalClasses = result.recordset.length
    let present = 0
    let absent = 0
    let excused = 0

    result.recordset.forEach((record) => {
      if (record.status === "present") present++
      else if (record.status === "absent") absent++
      else if (record.status === "excused") excused++
    })

    const stats = {
      totalClasses,
      present,
      absent,
      excused,
      presentPercentage: totalClasses > 0 ? (present / totalClasses) * 100 : 0,
      absentPercentage: totalClasses > 0 ? (absent / totalClasses) * 100 : 0,
      excusedPercentage: totalClasses > 0 ? (excused / totalClasses) * 100 : 0,
    }

    res.status(200).json({
      attendance: result.recordset,
      stats,
    })
  } catch (err) {
    next(err)
  }
}

// Get student profile
exports.getProfile = async (req, res, next) => {
  try {
    const studentId = req.user.id

    // Get database connection
    const pool = await getConnection()

    // Get student profile
    const result = await pool
      .request()
      .input("studentId", sql.Int, studentId)
      .query(`
        SELECT s.student_id as id, s.name, s.roll_number, s.email, s.phone_number, s.address
        FROM Students s
        JOIN Users u ON s.user_id = u.user_id
        WHERE u.user_id = @studentId
      `)

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Student profile not found" })
    }

    res.status(200).json({
      profile: result.recordset[0],
    })
  } catch (err) {
    next(err)
  }
}

// Get notices
exports.getNotices = async (req, res, next) => {
  try {
    // Get database connection
    const pool = await getConnection()

    // Get notices
    const result = await pool.request().query(`
        SELECT n.notice_id as id, n.title, n.content, n.created_at,
               CASE 
                 WHEN u.role = 'teacher' THEN t.name
                 WHEN u.role = 'management' THEN m.name
                 ELSE u.domain_id
               END as posted_by
        FROM Notices n
        JOIN Users u ON n.posted_by_user_id = u.user_id
        LEFT JOIN Teachers t ON u.user_id = t.user_id
        LEFT JOIN Management m ON u.user_id = m.user_id
        ORDER BY n.created_at DESC
      `)

    res.status(200).json({
      notices: result.recordset,
    })
  } catch (err) {
    next(err)
  }
}

// Get fee status
exports.getFeeStatus = async (req, res, next) => {
  try {
    const studentId = req.user.id

    // Get database connection
    const pool = await getConnection()

    // Get student ID from user ID
    const studentResult = await pool
      .request()
      .input("userId", sql.Int, studentId)
      .query(`
        SELECT student_id
        FROM Students
        WHERE user_id = @userId
      `)

    if (studentResult.recordset.length === 0) {
      return res.status(404).json({ message: "Student not found" })
    }

    const student_id = studentResult.recordset[0].student_id

    // Get fee status
    const result = await pool
      .request()
      .input("studentId", sql.Int, student_id)
      .query(`
        SELECT fee_id as id, amount, payment_status, payment_date
        FROM Fees
        WHERE student_id = @studentId
        ORDER BY payment_date DESC
      `)

    // Calculate statistics
    let totalFees = 0
    let paidFees = 0
    let pendingFees = 0
    let unpaidFees = 0

    result.recordset.forEach((fee) => {
      totalFees += fee.amount
      if (fee.payment_status === "paid") {
        paidFees += fee.amount
      } else if (fee.payment_status === "pending") {
        pendingFees += fee.amount
      } else if (fee.payment_status === "unpaid") {
        unpaidFees += fee.amount
      }
    })

    const stats = {
      totalFees,
      paidFees,
      pendingFees,
      unpaidFees,
      paidPercentage: totalFees > 0 ? (paidFees / totalFees) * 100 : 0,
    }

    res.status(200).json({
      fees: result.recordset,
      stats,
    })
  } catch (err) {
    next(err)
  }
}

// Pay fee
exports.payFee = async (req, res, next) => {
  try {
    const studentId = req.user.id
    const { feeId } = req.params

    // Get database connection
    const pool = await getConnection()

    // Get student ID from user ID
    const studentResult = await pool
      .request()
      .input("userId", sql.Int, studentId)
      .query(`
        SELECT student_id
        FROM Students
        WHERE user_id = @userId
      `)

    if (studentResult.recordset.length === 0) {
      return res.status(404).json({ message: "Student not found" })
    }

    const student_id = studentResult.recordset[0].student_id

    // Check if fee exists and belongs to student
    const feeCheck = await pool
      .request()
      .input("feeId", sql.Int, feeId)
      .input("studentId", sql.Int, student_id)
      .query(`
        SELECT * FROM Fees
        WHERE fee_id = @feeId AND student_id = @studentId
      `)

    if (feeCheck.recordset.length === 0) {
      return res.status(404).json({ message: "Fee not found or does not belong to student" })
    }

    // Check if fee is already paid
    if (feeCheck.recordset[0].payment_status === "paid") {
      return res.status(400).json({ message: "Fee is already paid" })
    }

    // Update fee status
    await pool
      .request()
      .input("feeId", sql.Int, feeId)
      .input("paymentDate", sql.Date, new Date())
      .query(`
        UPDATE Fees
        SET payment_status = 'paid', payment_date = @paymentDate
        WHERE fee_id = @feeId
      `)

    res.status(200).json({
      message: "Fee paid successfully",
    })
  } catch (err) {
    next(err)
  }
}
