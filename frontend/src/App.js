import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import Students from './pages/Students';
import Tasks from './pages/Tasks';
import Assignments from './pages/Assignments';
import RoleRoute from './components/RoleRoute';
import './styles/App.css';
import './styles/DarkTheme.css';
import './styles/TeacherDashboard.css';
import './styles/StudentDashboard.css';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <div className="App">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
              
              {/* Role-based dashboard routing */}
              <Route path="/dashboard" element={<PrivateRoute><RoleBasedDashboard /></PrivateRoute>} />
              
              {/* Teacher-only routes */}
              <Route path="/teacher/dashboard" element={<RoleRoute allowedRoles={['teacher']}><TeacherDashboard /></RoleRoute>} />
              <Route path="/students" element={<RoleRoute allowedRoles={['teacher']}><Students /></RoleRoute>} />
              <Route path="/tasks" element={<RoleRoute allowedRoles={['teacher']}><Tasks /></RoleRoute>} />
              <Route path="/assignments" element={<RoleRoute allowedRoles={['teacher']}><Assignments /></RoleRoute>} />
              
              {/* Student-only routes */}
              <Route path="/student/dashboard" element={<RoleRoute allowedRoles={['student']}><StudentDashboard /></RoleRoute>} />
              
              <Route path="/" element={<Navigate to="/dashboard" />} />
            </Routes>
          </main>
          </div>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

// Private route component
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  
  return user ? children : <Navigate to="/login" />;
};

// Public route component (redirect to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  
  return user ? <Navigate to="/dashboard" /> : children;
};

// Component to redirect to role-appropriate dashboard
const RoleBasedDashboard = () => {
  const { user } = useAuth();
  
  if (!user) return null;
  
  return user.role === 'teacher' ? 
    <Navigate to="/teacher/dashboard" replace /> : 
    <Navigate to="/student/dashboard" replace />;
};

export default App;