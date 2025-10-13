# Student Task Manager - MERN Application

A full-stack web application for managing student tasks built with the MERN stack (MongoDB, Express.js, React, Node.js).

## Features

- 🔐 **User Authentication** - Register and login with JWT tokens
- 📝 **Task Management** - Create, read, update, and delete tasks
- 🏷️ **Categorization** - Organize tasks by category (homework, project, exam, assignment, other)
- ⚡ **Priority Levels** - Set task priorities (low, medium, high)
- 📊 **Status Tracking** - Track task status (pending, in-progress, completed)
- 📅 **Due Date Management** - Set and track task due dates
- 📱 **Responsive Design** - Works on desktop and mobile devices
- 🎨 **Modern UI** - Clean and intuitive user interface

## Tech Stack

### Backend
- Node.js with Express.js
- MongoDB with Mongoose ODM
- JWT for authentication
- bcryptjs for password hashing
- CORS enabled
- Express Validator for input validation

### Frontend
- React 18 with functional components and hooks
- React Router for navigation
- Axios for API calls
- CSS3 for styling
- Context API for state management

## Prerequisites

Before running this application, make sure you have:

- [Node.js](https://nodejs.org/) (v14 or higher) installed
- [MongoDB](https://www.mongodb.com/) installed and running locally, or a MongoDB Atlas connection string
- [Git](https://git-scm.com/) for version control

## 🚀 Quick Start Guide

### Step 1: Check Node.js Installation
```bash
node --version
npm --version
```
If not installed, download from [nodejs.org](https://nodejs.org/)

### Step 2: Install Dependencies

**Backend Dependencies:**
```bash
cd backend
npm install
```

**Frontend Dependencies:**
```bash
cd frontend
npm install
```

### Step 3: Database Setup

**Option A: Local MongoDB**
1. Download and install [MongoDB Community Server](https://www.mongodb.com/try/download/community)
2. Start MongoDB service
3. Database will be created automatically at: `mongodb://localhost:27017/student-task-manager`

**Option B: MongoDB Atlas (Cloud)**
1. Create free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get connection string and update `backend/.env`

### Step 4: Environment Configuration
Update `backend/.env` file:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/student-task-manager
JWT_SECRET=your-super-secure-secret-key-here-make-it-long-and-random
NODE_ENV=development
```

### Step 5: Start the Application

**Using VS Code Tasks (Recommended):**
1. Press `Ctrl+Shift+P` in VS Code  
2. Type "Tasks: Run Task"
3. Select "Start Backend Server" (runs on http://localhost:5000)
4. Select "Start Frontend Development Server" (runs on http://localhost:3000)

**Using Terminal:**
cd backend
npm install
```

### 3. Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

### 4. Environment Setup

Create a `.env` file in the `backend` directory with the following variables:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/student-task-manager
JWT_SECRET=your-super-secret-jwt-key-here
NODE_ENV=development
```

**Important:** Replace `your-super-secret-jwt-key-here` with a strong, unique secret key.

### 5. Database Setup

Make sure MongoDB is running on your system:

- **Local MongoDB:** Start MongoDB service
- **MongoDB Atlas:** Update the `MONGODB_URI` in your `.env` file with your Atlas connection string

## Running the Application

### Method 1: Using VS Code Tasks (Recommended)

1. Open the project in VS Code
2. Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
3. Type "Tasks: Run Task" and select it
4. Choose from the available tasks:
   - **Install Backend Dependencies**
   - **Install Frontend Dependencies**
   - **Start Backend Server**
   - **Start Frontend Development Server**

### Method 2: Manual Startup

#### Start Backend Server
```bash
cd backend
npm run dev
```

The backend server will start on http://localhost:5000

#### Start Frontend Development Server
```bash
cd frontend
npm start
```

The frontend will start on http://localhost:3000

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Tasks
- `GET /api/tasks` - Get all user tasks (protected)
- `GET /api/tasks/:id` - Get single task (protected)
- `POST /api/tasks` - Create new task (protected)
- `PUT /api/tasks/:id` - Update task (protected)
- `DELETE /api/tasks/:id` - Delete task (protected)

## Project Structure

```
student-task-manager/
├── backend/
│   ├── controllers/
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── Task.js
│   │   └── User.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── tasks.js
│   ├── .env
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.js
│   │   │   ├── TaskForm.js
│   │   │   └── TaskItem.js
│   │   ├── context/
│   │   │   └── AuthContext.js
│   │   ├── pages/
│   │   │   ├── Dashboard.js
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   └── Tasks.js
│   │   ├── services/
│   │   │   ├── authService.js
│   │   │   └── taskService.js
│   │   ├── styles/
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── .github/
│   └── copilot-instructions.md
└── README.md
```

## Usage

1. **Register/Login:** Create an account or login with existing credentials
2. **Dashboard:** View your task statistics and recent tasks
3. **Manage Tasks:** 
   - Click "Manage Tasks" or "Tasks" in the navigation
   - Add new tasks using the "Add New Task" button
   - Filter tasks by status, category, or priority
   - Edit tasks by clicking the edit icon
   - Delete tasks by clicking the delete icon
   - Mark tasks as completed by updating their status

## Development

### Backend Development
- The backend uses `nodemon` for automatic server restarts during development
- API routes are organized in the `routes/` directory
- Database models are in the `models/` directory
- Middleware is in the `middleware/` directory

### Frontend Development
- React development server provides hot reloading
- Components are organized in the `components/` directory
- Pages are in the `pages/` directory
- Styles are modular and component-specific

## Testing

To run tests (when implemented):

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## Building for Production

### Backend
```bash
cd backend
npm start
```

### Frontend
```bash
cd frontend
npm run build
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

If you encounter any issues or have questions:

1. Check the console for error messages
2. Ensure MongoDB is running
3. Verify all environment variables are set correctly
4. Make sure both frontend and backend servers are running

---

Built with ❤️ using the MERN stack 

-Adnan