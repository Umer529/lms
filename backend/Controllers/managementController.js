const { getConnection, sql } = require("../config/db")

// Get all users
exports.getUsers = async (req, res, next) => {
  try {
    // Get database connection
    const pool = await getConnection()

    // Get query parameters for filtering
    const { role, search } = req.query

    // Build query
    let query = `
      SELECT u.user_id as id, u.domain_id, u.role, u.created_at,
      CASE 
        WHEN u.role = 'student' THEN s.name
        WHEN u.role = 'teacher' THEN t.name
        WHEN u.role = 'management' THEN m.name
      END as name,
      CASE 
        WHEN u.role = 'student' THEN s.email
        WHEN u.role = 'teacher' THEN t.email
        WHEN u.role = 'management' THEN m.email
      END as email
      FROM Users u
      LEFT JOIN Students s ON u.user_id = s.user_id
      LEFT JOIN Teachers t ON u.user_id = t.user_id
      LEFT JOIN Management m ON u.user_id = m.user_id
      WHERE 1=1
    `

    const queryParams = []
    const request = pool.request()

    // Add role filter if provided
    if (role) {
      query += " AND u.role = @role"
      request.input("role", sql.VarChar, role)
    }

    // Add search filter if provided
    if (search) {
      query += ` AND (
        u.domain_id LIKE @search OR
        s.name LIKE @search OR
        t.name LIKE @search OR
        m.name LIKE @search OR
        s.email LIKE @search OR
        t.email LIKE @search OR
        m.email LIKE @search
      )`
      request.input("search", sql.VarChar, `%${search}%`)
    }

    // Add order by
    query += " ORDER BY u.created_at DESC"

    // Execute query
    const result = await request.query(query)

    res.status(200).json({
      users: result.recordset,
    })
  } catch (err) {
    next(err)
  }
}

// Create new user
exports.createUser = async (req, res, next) => {
  const { domain_id, password, role, name, email, phone_number, department, address, roll_number } = req.body

  try {
    // Validate input
    if (!domain_id || !password || !role || !name || !email) {
      return res.status(400).json({ message: "Please provide domain_id, password, role, name, and email" })
    }

    // Get database connection
    const pool = await getConnection()

    // Begin transaction
    const transaction = new sql.Transaction(pool)
    await transaction.begin()

    try {
      const request = new sql.Request(transaction)

      // Check if user already exists
      const userCheck = await request
        .input("domain_id", sql.VarChar, domain_id)
        .query("SELECT * FROM Users WHERE domain_id = @domain_id")

      if (userCheck.recordset.length > 0) {
        await transaction.rollback()
        return res.status(400).json({ message: "User already exists" })
      }

      // Insert user
      const userResult = await request
        .input("domain_id", sql.VarChar, domain_id)
        .input("password_hash", sql.VarChar, password) // In production, this should be hashed
        .input("role", sql.VarChar, role)
        .query(`
          INSERT INTO Users (domain_id, password_hash, role)
          OUTPUT INSERTED.user_id
          VALUES (@domain_id, @password_hash, @role)
        `)

      const user_id = userResult.recordset[0].user_id

      // Insert role-specific data
      if (role === "student") {
        if (!roll_number) {
          await transaction.rollback()
          return res.status(400).json({ message: "Roll number is required for students" })
        }

        await request
          .input("user_id", sql.Int, user_id)
          .input("name", sql.VarChar, name)
          .input("roll_number", sql.VarChar, roll_number)
          .input("email", sql.VarChar, email)
          .input("phone_number", sql.VarChar, phone_number || null)
          .input("address", sql.Text, address || null)
          .query(`
            INSERT INTO Students (user_id, name, roll_number, email, phone_number, address)
            VALUES (@user_id, @name, @roll_number, @email, @phone_number, @address)
          `)
      } else if (role === "teacher") {
        await request
          .input("user_id", sql.Int, user_id)
          .input("name", sql.VarChar, name)
          .input("email", sql.VarChar, email)
          .input("phone_number", sql.VarChar, phone_number || null)
          .input("department", sql.VarChar, department || null)
          .query(`
            INSERT INTO Teachers (user_id, name, email, phone_number, department)
            VALUES (@user_id, @name, @email, @phone_number, @department)
          `)
      } else if (role === "management") {
        await request
          .input("user_id", sql.Int, user_id)
          .input("name", sql.VarChar, name)
          .input("email", sql.VarChar, email)
          .input("phone_number", sql.VarChar, phone_number || null)
          .query(`
            INSERT INTO Management (user_id, name, email, phone_number)
            VALUES (@user_id, @name, @email, @phone_number)
          `)
      }

      // Commit transaction
      await transaction.commit()

      res.status(201).json({
        message: "User created successfully",
        user: {
          id: user_id,
          domain_id,
          role,
          name,
          email,
        },
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

// Update user
exports.updateUser = async (req, res, next) => {
  const { id } = req.params
  const { name, email, phone_number, department, address } = req.body

  try {
    // Get database connection
    const pool = await getConnection()

    // Get user role
    const userCheck = await pool.request().input("id", sql.Int, id).query("SELECT role FROM Users WHERE user_id = @id")

    if (userCheck.recordset.length === 0) {
      return res.status(404).json({ message: "User not found" })
    }

    const role = userCheck.recordset[0].role

    // Update role-specific data
    let updateQuery
    const request = pool.request().input("id", sql.Int, id)

    if (role === "student") {
      updateQuery = `
        UPDATE Students
        SET name = ISNULL(@name, name),
            email = ISNULL(@email, email),
            phone_number = ISNULL(@phone_number, phone_number),
            address = ISNULL(@address, address)
        OUTPUT INSERTED.name, INSERTED.email, INSERTED.phone_number, INSERTED.address
        WHERE user_id = @id
      `
      if (name) request.input("name", sql.VarChar, name)
      if (email) request.input("email", sql.VarChar, email)
      if (phone_number) request.input("phone_number", sql.VarChar, phone_number)
      if (address) request.input("address", sql.Text, address)
    } else if (role === "teacher") {
      updateQuery = `
        UPDATE Teachers
        SET name = ISNULL(@name, name),
            email = ISNULL(@email, email),
            phone_number = ISNULL(@phone_number, phone_number),
            department = ISNULL(@department, department)
        OUTPUT INSERTED.name, INSERTED.email, INSERTED.phone_number, INSERTED.department
        WHERE user_id = @id
      `
      if (name) request.input("name", sql.VarChar, name)
      if (email) request.input("email", sql.VarChar, email)
      if (phone_number) request.input("phone_number", sql.VarChar, phone_number)
      if (department) request.input("department", sql.VarChar, department)
    } else if (role === "management") {
      updateQuery = `
        UPDATE Management
        SET name = ISNULL(@name, name),
            email = ISNULL(@email, email),
            phone_number = ISNULL(@phone_number, phone_number)
        OUTPUT INSERTED.name, INSERTED.email, INSERTED.phone_number
        WHERE user_id = @id
      `
      if (name) request.input("name", sql.VarChar, name)
      if (email) request.input("email", sql.VarChar, email)
      if (phone_number) request.input("phone_number", sql.VarChar, phone_number)
    }

    const result = await request.query(updateQuery)

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: `${role} profile not found` })
    }

    res.status(200).json({
      message: "User updated successfully",
      user: {
        id: Number.parseInt(id),
        role,
        ...result.recordset[0],
      },
    })
  } catch (err) {
    next(err)
  }
}

// Delete user
exports.deleteUser = async (req, res, next) => {
  const { id } = req.params

  try {
    // Get database connection
    const pool = await getConnection()

    // Check if user exists
    const userCheck = await pool.request().input("id", sql.Int, id).query("SELECT * FROM Users WHERE user_id = @id")

    if (userCheck.recordset.length === 0) {
      return res.status(404).json({ message: "User not found" })
    }

    // Begin transaction
    const transaction = new sql.Transaction(pool)
    await transaction.begin()

    try {
      const request = new sql.Request(transaction)

      // Delete user (cascade will handle related records)
      await request.input("id", sql.Int, id).query("DELETE FROM Users WHERE user_id = @id")

      // Commit transaction
      await transaction.commit()

      res.status(200).json({
        message: "User deleted successfully",
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

// Get all courses
exports.getCourses = async (req, res, next) => {
  try {
    // Get database connection
    const pool = await getConnection()

    // Get query parameters for filtering
    const { teacher_id, search } = req.query

    // Build query
    let query = `
      SELECT c.course_id as id, c.course_code as code, c.course_name as name, 
             c.schedule, c.teacher_id, t.name as teacher_name,
             COUNT(e.student_id) as enrolled_students
      FROM Courses c
      LEFT JOIN Teachers t ON c.teacher_id = t.teacher_id
      LEFT JOIN Enrollments e ON c.course_id = e.course_id
    `

    const whereConditions = []
    const request = pool.request()

    // Add teacher filter if provided
    if (teacher_id) {
      whereConditions.push("c.teacher_id = @teacher_id")
      request.input("teacher_id", sql.Int, teacher_id)
    }

    // Add search filter if provided
    if (search) {
      whereConditions.push("(c.course_code LIKE @search OR c.course_name LIKE @search)")
      request.input("search", sql.VarChar, `%${search}%`)
    }

    // Add where clause if conditions exist
    if (whereConditions.length > 0) {
      query += " WHERE " + whereConditions.join(" AND ")
    }

    // Add group by and order by
    query += " GROUP BY c.course_id, c.course_code, c.course_name, c.schedule, c.teacher_id, t.name"
    query += " ORDER BY c.course_code"

    // Execute query
    const result = await request.query(query)

    res.status(200).json({
      courses: result.recordset,
    })
  } catch (err) {
    next(err)
  }
}

// Create new course
exports.createCourse = async (req, res, next) => {
  const { course_code, course_name, schedule, teacher_id } = req.body

  try {
    // Validate input
    if (!course_code || !course_name) {
      return res.status(400).json({ message: "Please provide course code and name" })
    }

    // Get database connection
    const pool = await getConnection()

    // Check if course code already exists
    const courseCheck = await pool
      .request()
      .input("course_code", sql.VarChar, course_code)
      .query("SELECT * FROM Courses WHERE course_code = @course_code")

    if (courseCheck.recordset.length > 0) {
      return res.status(400).json({ message: "Course code already exists" })
    }

    // If teacher_id provided, check if teacher exists
    if (teacher_id) {
      const teacherCheck = await pool
        .request()
        .input("teacher_id", sql.Int, teacher_id)
        .query("SELECT * FROM Teachers WHERE teacher_id = @teacher_id")

      if (teacherCheck.recordset.length === 0) {
        return res.status(400).json({ message: "Teacher not found" })
      }
    }

    // Insert course
    const result = await pool
      .request()
      .input("course_code", sql.VarChar, course_code)
      .input("course_name", sql.VarChar, course_name)
      .input("schedule", sql.VarChar, schedule || null)
      .input("teacher_id", sql.Int, teacher_id || null)
      .query(`
        INSERT INTO Courses (course_code, course_name, schedule, teacher_id)
        OUTPUT INSERTED.course_id as id, INSERTED.course_code as code, 
               INSERTED.course_name as name, INSERTED.schedule, INSERTED.teacher_id
        VALUES (@course_code, @course_name, @schedule, @teacher_id)
      `)

    const course = result.recordset[0]

    // If teacher assigned, get teacher name
    let teacher_name = null
    if (teacher_id) {
      const teacherResult = await pool
        .request()
        .input("teacher_id", sql.Int, teacher_id)
        .query("SELECT name FROM Teachers WHERE teacher_id = @teacher_id")

      if (teacherResult.recordset.length > 0) {
        teacher_name = teacherResult.recordset[0].name
      }
    }

    res.status(201).json({
      message: "Course created successfully",
      course: {
        ...course,
        teacher_name,
        enrolled_students: 0,
      },
    })
  } catch (err) {
    next(err)
  }
}

// Update course
exports.updateCourse = async (req, res, next) => {
  const { id } = req.params
  const { name, code, description, teacherId } = req.body

  try {
    // Get database connection
    const pool = await getConnection()

    // Check if course exists
    const courseCheck = await pool.request().input("id", sql.Int, id).query("SELECT * FROM Courses WHERE id = @id")

    if (courseCheck.recordset.length === 0) {
      return res.status(404).json({ message: "Course not found" })
    }

    // Build update query
    let updateQuery = "UPDATE Courses SET "
    const queryParams = []

    if (name) {
      queryParams.push("name = @name")
    }

    if (code) {
      // Check if code is already taken by another course
      const codeCheck = await pool
        .request()
        .input("code", sql.VarChar, code)
        .input("id", sql.Int, id)
        .query("SELECT * FROM Courses WHERE code = @code AND id != @id")

      if (codeCheck.recordset.length > 0) {
        return res.status(400).json({ message: "Course code already in use" })
      }

      queryParams.push("code = @code")
    }

    if (description !== undefined) {
      queryParams.push("description = @description")
    }

    if (teacherId !== undefined) {
      if (teacherId === null) {
        queryParams.push("teacherId = NULL")
      } else {
        // Check if teacher exists
        const teacherCheck = await pool
          .request()
          .input("teacherId", sql.Int, teacherId)
          .query("SELECT * FROM Users WHERE id = @teacherId AND role = 'teacher'")

        if (teacherCheck.recordset.length === 0) {
          return res.status(400).json({ message: "Teacher not found" })
        }

        queryParams.push("teacherId = @teacherId")
      }
    }

    queryParams.push("updatedAt = @updatedAt")

    if (queryParams.length === 1) {
      // Only updatedAt
      return res.status(400).json({ message: "No fields to update" })
    }

    updateQuery += queryParams.join(", ")
    updateQuery +=
      " OUTPUT INSERTED.id, INSERTED.name, INSERTED.code, INSERTED.description, INSERTED.teacherId WHERE id = @id"

    // Update course
    const request = pool.request().input("id", sql.Int, id).input("updatedAt", sql.DateTime, new Date())

    if (name) request.input("name", sql.VarChar, name)
    if (code) request.input("code", sql.VarChar, code)
    if (description !== undefined) request.input("description", sql.VarChar, description)
    if (teacherId !== undefined && teacherId !== null) request.input("teacherId", sql.Int, teacherId)

    const result = await request.query(updateQuery)

    const course = result.recordset[0]

    res.status(200).json({
      message: "Course updated successfully",
      course,
    })
  } catch (err) {
    next(err)
  }
}

// Delete course
exports.deleteCourse = async (req, res, next) => {
  const { id } = req.params

  try {
    // Get database connection
    const pool = await getConnection()

    // Check if course exists
    const courseCheck = await pool.request().input("id", sql.Int, id).query("SELECT * FROM Courses WHERE id = @id")

    if (courseCheck.recordset.length === 0) {
      return res.status(404).json({ message: "Course not found" })
    }

    // Begin transaction
    const transaction = new sql.Transaction(pool)
    await transaction.begin()

    try {
      const request = new sql.Request(transaction)

      // Delete related records first
      await request.input("courseId", sql.Int, id).query("DELETE FROM Attendance WHERE courseId = @courseId")

      await request.input("courseId", sql.Int, id).query(`
          DELETE FROM Grades 
          WHERE assignmentId IN (SELECT id FROM Assignments WHERE courseId = @courseId)
        `)

      await request.input("courseId", sql.Int, id).query("DELETE FROM Assignments WHERE courseId = @courseId")

      await request.input("courseId", sql.Int, id).query("DELETE FROM Enrollments WHERE courseId = @courseId")

      // Finally delete the course
      await request.input("courseId", sql.Int, id).query("DELETE FROM Courses WHERE id = @courseId")

      // Commit transaction
      await transaction.commit()

      res.status(200).json({
        message: "Course deleted successfully",
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
