const { getConnection, sql } = require("../config/db")

// Get teacher courses
exports.getCourses = async (req, res, next) => {
  try {
    const teacherId = req.user.id

    // Get database connection
    const pool = await getConnection()

    // Get teacher ID from user ID
    const teacherResult = await pool
      .request()
      .input("userId", sql.Int, teacherId)
      .query(`
        SELECT teacher_id
        FROM Teachers
        WHERE user_id = @userId
      `)

    if (teacherResult.recordset.length === 0) {
      return res.status(404).json({ message: "Teacher not found" })
    }

    const teacher_id = teacherResult.recordset[0].teacher_id

    // Get courses taught by teacher
    const result = await pool
      .request()
      .input("teacherId", sql.Int, teacher_id)
      .query(`
        SELECT c.course_id as id, c.course_code as code, c.course_name as name, 
               c.schedule, COUNT(e.student_id) as enrolledStudents
        FROM Courses c
        LEFT JOIN Enrollments e ON c.course_id = e.course_id
        WHERE c.teacher_id = @teacherId
        GROUP BY c.course_id, c.course_code, c.course_name, c.schedule
      `)

    res.status(200).json({
      courses: result.recordset,
    })
  } catch (err) {
    next(err)
  }
}

// Get students in a course
exports.getCourseStudents = async (req, res, next) => {
  try {
    const { courseId } = req.params
    const teacherId = req.user.id

    // Get database connection
    const pool = await getConnection()

    // Get teacher ID from user ID
    const teacherResult = await pool
      .request()
      .input("userId", sql.Int, teacherId)
      .query(`
        SELECT teacher_id
        FROM Teachers
        WHERE user_id = @userId
      `)

    if (teacherResult.recordset.length === 0) {
      return res.status(404).json({ message: "Teacher not found" })
    }

    const teacher_id = teacherResult.recordset[0].teacher_id

    // Verify teacher teaches this course
    const courseCheck = await pool
      .request()
      .input("courseId", sql.Int, courseId)
      .input("teacherId", sql.Int, teacher_id)
      .query("SELECT course_id FROM Courses WHERE course_id = @courseId AND teacher_id = @teacherId")

    if (courseCheck.recordset.length === 0) {
      return res.status(403).json({ message: "You do not have permission to access this course" })
    }

    // Get students enrolled in the course
    const result = await pool
      .request()
      .input("courseId", sql.Int, courseId)
      .query(`
        SELECT s.student_id as id, s.name, s.email, s.roll_number, 
               e.enrollment_status as status, e.created_at as enrolledAt
        FROM Students s
        JOIN Enrollments e ON s.student_id = e.student_id
        WHERE e.course_id = @courseId
        ORDER BY s.name
      `)

    res.status(200).json({
      students: result.recordset,
    })
  } catch (err) {
    next(err)
  }
}

// Update student grade
exports.updateGrade = async (req, res, next) => {
  try {
    const { gradeId } = req.params
    const { grade, feedback } = req.body
    const teacherId = req.user.id

    // Validate input
    if (!grade) {
      return res.status(400).json({ message: "Please provide a grade" })
    }

    // Get database connection
    const pool = await getConnection()

    // Get teacher ID from user ID
    const teacherResult = await pool
      .request()
      .input("userId", sql.Int, teacherId)
      .query(`
        SELECT teacher_id
        FROM Teachers
        WHERE user_id = @userId
      `)

    if (teacherResult.recordset.length === 0) {
      return res.status(404).json({ message: "Teacher not found" })
    }

    const teacher_id = teacherResult.recordset[0].teacher_id

    // Verify teacher has permission to update this grade
    const gradeCheck = await pool
      .request()
      .input("gradeId", sql.Int, gradeId)
      .input("teacherId", sql.Int, teacher_id)
      .query(`
        SELECT g.id
        FROM Grades g
        JOIN Assignments a ON g.assignmentId = a.id
        JOIN Courses c ON a.courseId = c.id
        WHERE g.id = @gradeId AND c.teacherId = @teacherId
      `)

    if (gradeCheck.recordset.length === 0) {
      return res.status(403).json({ message: "You do not have permission to update this grade" })
    }

    // Update grade
    await pool
      .request()
      .input("gradeId", sql.Int, gradeId)
      .input("grade", sql.VarChar, grade)
      .input("feedback", sql.VarChar, feedback || "")
      .input("gradedAt", sql.DateTime, new Date())
      .query(`
        UPDATE Grades
        SET grade = @grade, feedback = @feedback, gradedAt = @gradedAt
        WHERE id = @gradeId
      `)

    res.status(200).json({
      message: "Grade updated successfully",
    })
  } catch (err) {
    next(err)
  }
}

// Take attendance
exports.takeAttendance = async (req, res, next) => {
  try {
    const { courseId } = req.params
    const { attendanceRecords } = req.body
    const teacherId = req.user.id

    // Validate input
    if (!attendanceRecords || !Array.isArray(attendanceRecords)) {
      return res.status(400).json({ message: "Please provide attendance records" })
    }

    // Get database connection
    const pool = await getConnection()

    // Get teacher ID from user ID
    const teacherResult = await pool
      .request()
      .input("userId", sql.Int, teacherId)
      .query(`
        SELECT teacher_id
        FROM Teachers
        WHERE user_id = @userId
      `)

    if (teacherResult.recordset.length === 0) {
      return res.status(404).json({ message: "Teacher not found" })
    }

    const teacher_id = teacherResult.recordset[0].teacher_id

    // Verify teacher teaches this course
    const courseCheck = await pool
      .request()
      .input("courseId", sql.Int, courseId)
      .input("teacherId", sql.Int, teacher_id)
      .query("SELECT course_id FROM Courses WHERE course_id = @courseId AND teacher_id = @teacherId")

    if (courseCheck.recordset.length === 0) {
      return res.status(403).json({ message: "You do not have permission to take attendance for this course" })
    }

    // Begin transaction
    const transaction = new sql.Transaction(pool)
    await transaction.begin()

    try {
      const request = new sql.Request(transaction)
      const date = new Date()

      // Insert attendance records
      for (const record of attendanceRecords) {
        await request
          .input("studentId", sql.Int, record.studentId)
          .input("courseId", sql.Int, courseId)
          .input("date", sql.Date, date)
          .input("status", sql.VarChar, record.status)
          .query(`
            INSERT INTO Attendance (student_id, course_id, attendance_date, status)
            VALUES (@studentId, @courseId, @date, @status)
          `)
      }

      // Commit transaction
      await transaction.commit()

      res.status(201).json({
        message: "Attendance recorded successfully",
      })
    } catch (err) {
      // Rollback transaction on error
      await transaction.rollback()
      throw err
    }
  } catch (err) {
    next(err)
  }
}

// Get teacher profile
exports.getProfile = async (req, res, next) => {
  try {
    const teacherId = req.user.id

    // Get database connection
    const pool = await getConnection()

    // Get teacher profile
    const result = await pool
      .request()
      .input("teacherId", sql.Int, teacherId)
      .query(`
        SELECT t.teacher_id as id, t.name, t.email, t.phone_number, t.department
        FROM Teachers t
        JOIN Users u ON t.user_id = u.user_id
        WHERE u.user_id = @teacherId
      `)

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Teacher profile not found" })
    }

    res.status(200).json({
      profile: result.recordset[0],
    })
  } catch (err) {
    next(err)
  }
}

// Create assignment
exports.createAssignment = async (req, res, next) => {
  try {
    const { courseId } = req.params
    const { title, description, dueDate, totalMarks } = req.body
    const teacherId = req.user.id

    // Validate input
    if (!title || !totalMarks) {
      return res.status(400).json({ message: "Please provide title and total marks" })
    }

    // Get database connection
    const pool = await getConnection()

    // Get teacher ID from user ID
    const teacherResult = await pool
      .request()
      .input("userId", sql.Int, teacherId)
      .query(`
        SELECT teacher_id
        FROM Teachers
        WHERE user_id = @userId
      `)

    if (teacherResult.recordset.length === 0) {
      return res.status(404).json({ message: "Teacher not found" })
    }

    const teacher_id = teacherResult.recordset[0].teacher_id

    // Verify teacher teaches this course
    const courseCheck = await pool
      .request()
      .input("courseId", sql.Int, courseId)
      .input("teacherId", sql.Int, teacher_id)
      .query("SELECT course_id FROM Courses WHERE course_id = @courseId AND teacher_id = @teacherId")

    if (courseCheck.recordset.length === 0) {
      return res.status(403).json({ message: "You do not have permission to create assignments for this course" })
    }

    // Create assignment
    const result = await pool
      .request()
      .input("courseId", sql.Int, courseId)
      .input("title", sql.VarChar, title)
      .input("description", sql.VarChar, description || null)
      .input("dueDate", sql.Date, dueDate ? new Date(dueDate) : null)
      .input("totalMarks", sql.Decimal, totalMarks)
      .input("createdAt", sql.DateTime, new Date())
      .query(`
        INSERT INTO Assignments (course_id, title, description, due_date, total_marks, created_at)
        OUTPUT INSERTED.id, INSERTED.title, INSERTED.description, INSERTED.due_date, INSERTED.total_marks
        VALUES (@courseId, @title, @description, @dueDate, @totalMarks, @createdAt)
      `)

    res.status(201).json({
      message: "Assignment created successfully",
      assignment: result.recordset[0],
    })
  } catch (err) {
    next(err)
  }
}

// Post notice
exports.postNotice = async (req, res, next) => {
  try {
    const { title, content } = req.body
    const teacherId = req.user.id

    // Validate input
    if (!title || !content) {
      return res.status(400).json({ message: "Please provide title and content" })
    }

    // Get database connection
    const pool = await getConnection()

    // Post notice
    const result = await pool
      .request()
      .input("title", sql.VarChar, title)
      .input("content", sql.Text, content)
      .input("postedBy", sql.Int, teacherId)
      .input("createdAt", sql.DateTime, new Date())
      .query(`
        INSERT INTO Notices (title, content, posted_by_user_id, created_at)
        OUTPUT INSERTED.notice_id as id, INSERTED.title, INSERTED.content, INSERTED.created_at
        VALUES (@title, @content, @postedBy, @createdAt)
      `)

    res.status(201).json({
      message: "Notice posted successfully",
      notice: result.recordset[0],
    })
  } catch (err) {
    next(err)
  }
}
