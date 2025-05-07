# Learning Management System (LMS)

A complete Learning Management System with role-based authentication and authorization.

## Features

- Role-based authentication (Student, Teacher, Management)
- Dashboard for each role with specific functionalities
- Student features: View courses, grades, and attendance
- Teacher features: Manage courses, take attendance, and grade assignments
- Admin features: User management and course management

## Tech Stack

- **Frontend**: React, React Router, Axios
- **Backend**: Node.js, Express
- **Database**: Microsoft SQL Server
- **Authentication**: JWT

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- Microsoft SQL Server
- SQL Server Management Studio (SSMS) or Azure Data Studio

### Database Setup

1. Open SSMS or Azure Data Studio and connect to your SQL Server instance
2. Run the SQL script in `database/schema.sql` to create the database, tables, and stored procedures
3. Verify that the database and tables are created successfully

### Backend Setup

1. Navigate to the backend directory
2. Create a `.env` file with the following variables:
   \`\`\`
   PORT=5000
   NODE_ENV=development
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_SERVER=your_db_server
   DB_NAME=your_db_name
   JWT_SECRET=your_jwt_secret_key
   \`\`\`
3. Install dependencies:
   \`\`\`
   npm install
   \`\`\`
4. Start the backend server:
   \`\`\`
   npm run dev
   \`\`\`
5. The server should start on port 5000

### Frontend Setup

1. Navigate to the frontend directory
2. Install dependencies:
   \`\`\`
   npm install
   \`\`\`
3. Start the frontend development server:
   \`\`\`
   npm start
   \`\`\`
4. The application should open in your browser at http://localhost:3000

## API Documentation

### Authentication Endpoints

- `POST /api/auth/login` - Login with email and password
- `POST /api/auth/register` - Register a new user (requires management role)
- `GET /api/auth/me` - Get current user information

### Student Endpoints

- `GET /api/student/courses` - Get student courses
- `GET /api/student/grades` - Get student grades
- `GET /api/student/attendance` - Get student attendance

### Teacher Endpoints

- `GET /api/teacher/courses` - Get teacher courses
- `GET /api/teacher/courses/:courseId/students` - Get students in a course
- `PUT /api/teacher/grades/:gradeId` - Update student grade
- `POST /api/teacher/courses/:courseId/attendance` - Take attendance

### Admin Endpoints

- `GET /api/admin/users` - Get all users
- `POST /api/admin/users` - Create a new user
- `PUT /api/admin/users/:id` - Update a user
- `DELETE /api/admin/users/:id` - Delete a user
- `GET /api/admin/courses` - Get all courses
- `POST /api/admin/courses` - Create a new course
- `PUT /api/admin/courses/:id` - Update a course
- `DELETE /api/admin/courses/:id` - Delete a course
