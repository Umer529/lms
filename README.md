# Learning Management System (LMS) Backend

A comprehensive Learning Management System backend built with Node.js and Microsoft SQL Server.

## Features

### Student Mode
- View Profile
- Course Enrollment
- Grade Tracking
- Attendance Tracking
- Notice Board
- Fee Payment

### Teacher Mode
- View Profile
- Course Management (including creating course materials, assignments, and quizzes)
- Grade Entry
- Attendance Tracking
- Student Progress
- Notice Board

### Management Mode
- User Management
- Course Management
- Report Generation
- Notice Board
- System Configuration
- Fee Management

## Installation

1. Clone the repository:
   \`\`\`
   git clone https://github.com/yourusername/lms-backend.git
   cd lms-backend
   \`\`\`

2. Install dependencies:
   \`\`\`
   npm install
   \`\`\`

3. Create a `.env` file in the root directory with the following variables:
   \`\`\`
   PORT=5000
   NODE_ENV=development
   
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_NAME=LMS
   DB_SERVER=localhost
   DB_ENCRYPT=false
   DB_TRUST_SERVER_CERTIFICATE=true
   
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRE=1d
   \`\`\`

4. Set up the database:
   - Create a database named `LMS` in your Microsoft SQL Server
   - Run the SQL scripts in the `database` folder to create tables and stored procedures

5. Start the server:
   \`\`\`
   npm start
   \`\`\`

## API Documentation

### Authentication Routes
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/forgot-password` - Forgot password
- `POST /api/auth/reset-password` - Reset password

### Student Routes
- `GET /api/student/profile` - Get student profile  - Reset password

### Student Routes
- `GET /api/student/profile` - Get student profile
- `GET /api/student/courses` - Get student courses
- `GET /api/student/grades` - Get student grades
- `GET /api/student/attendance` - Get student attendance
- `GET /api/student/notices` - Get notices
- `GET /api/student/fees` - Get fee status
- `POST /api/student/fees/:feeId/pay` - Pay fee
- `POST /api/student/courses/:courseId/enroll` - Enroll in a course
- `GET /api/student/available-courses` - Get available courses for enrollment

### Teacher Routes
- `GET /api/teacher/profile` - Get teacher profile
- `GET /api/teacher/courses` - Get teacher courses
- `GET /api/teacher/courses/:courseId/students` - Get students in a course
- `PUT /api/teacher/grades/:gradeId` - Update student grade
- `POST /api/teacher/courses/:courseId/attendance` - Take attendance
- `POST /api/teacher/courses/:courseId/assignments` - Create assignment
- `POST /api/teacher/notices` - Post notice
- `GET /api/teacher/courses/:courseId/assignments` - Get course assignments
- `PUT /api/teacher/courses/:courseId/components/:componentName/grades` - Update grades
- `GET /api/teacher/courses/:courseId/attendance` - Get course attendance
- `GET /api/teacher/courses/:courseId/students/:studentId/progress` - Get student progress
- `POST /api/teacher/courses/:courseId/quizzes` - Create quiz

### Management Routes
- `GET /api/management/users` - Get all users
- `POST /api/management/users` - Create new user
- `PUT /api/management/users/:id` - Update user
- `DELETE /api/management/users/:id` - Delete user
- `GET /api/management/courses` - Get all courses
- `POST /api/management/courses` - Create new course
- `PUT /api/management/courses/:id` - Update course
- `DELETE /api/management/courses/:id` - Delete course
- `GET /api/management/reports/:reportType` - Generate reports
- `POST /api/management/fees/:action` - Manage fees
- `POST /api/management/notices` - Post notice
- `POST /api/management/system-config` - System configuration

## Error Handling

The API uses standard HTTP status codes to indicate the success or failure of requests:

- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Security

- JWT authentication
- Password hashing with bcrypt
- Rate limiting
- Helmet for HTTP headers security
- CORS enabled

## License

This project is licensed under the MIT License - see the LICENSE file for details.
\`\`\`

## Deployment Instructions

To deploy this LMS backend:

1. Set up a Microsoft SQL Server database
2. Create the necessary tables and stored procedures using the provided schema
3. Configure environment variables for production
4. Build and deploy the Node.js application
5. Set up proper security measures (HTTPS, firewall rules, etc.)

The system is now ready to be integrated with a frontend application to provide a complete Learning Management System solution.
