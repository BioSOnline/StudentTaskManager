import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          Student Task Manager
        </Link>
        
        <div className="nav-menu">
          {user ? (
            <>
              <Link to="/dashboard" className="nav-link">Dashboard</Link>
              {user.role === 'teacher' && (
                <>
                  <Link to="/students" className="nav-link">Students</Link>
                  <Link to="/tasks" className="nav-link">Tasks</Link>
                  <Link to="/assignment-management" className="nav-link">Assignments</Link>
                  <Link to="/assignments" className="nav-link">Submissions</Link>
                </>
              )}
              <div className="nav-user">
                <span>Welcome, {user.name}</span>
                <button onClick={handleLogout} className="logout-btn">
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/register" className="nav-link">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;