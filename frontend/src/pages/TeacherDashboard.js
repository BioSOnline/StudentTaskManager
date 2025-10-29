import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { taskService } from '../services/taskService';
import { studentService } from '../services/studentService';
import '../styles/Dashboard.css';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTasks: 0,
    pendingSubmissions: 0,
    completedTasks: 0
  });
  const [recentTasks, setRecentTasks] = useState([]);
  const [recentStudents, setRecentStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data concurrently
      const [students, tasks] = await Promise.all([
        studentService.getStudents(),
        taskService.getTasks()
      ]);

      // Calculate statistics
      const pendingSubmissions = tasks.filter(task => 
        task.status === 'pending' || task.status === 'in-progress'
      ).length;
      
      const completedTasks = tasks.filter(task => 
        task.status === 'completed'
      ).length;

      setStats({
        totalStudents: students.length,
        totalTasks: tasks.length,
        pendingSubmissions,
        completedTasks
      });

      // Get recent data
      setRecentTasks(tasks.slice(0, 5));
      setRecentStudents(students.slice(0, 5));

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="teacher-dashboard">
      <div className="teacher-header">
        <h1 className="teacher-welcome">Welcome back, {user.name}! 👨‍🏫</h1>
        <p className="teacher-subtitle">Manage your students and track their progress</p>
      </div>

      {/* Statistics Cards */}
      <div className="stats-overview">
        <div className="stats-grid">
          <div className="stat-card students">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <div className="stat-number">{stats.totalStudents}</div>
              <div className="stat-label">Total Students</div>
            </div>
            <Link to="/students" className="stat-link">View All →</Link>
          </div>

          <div className="stat-card tasks">
            <div className="stat-icon">📝</div>
            <div className="stat-content">
              <div className="stat-number">{stats.totalTasks}</div>
              <div className="stat-label">Total Tasks</div>
            </div>
            <Link to="/tasks" className="stat-link">Manage →</Link>
          </div>

          <div className="stat-card pending">
            <div className="stat-icon">⏰</div>
            <div className="stat-content">
              <div className="stat-number">{stats.pendingSubmissions}</div>
              <div className="stat-label">Pending Tasks</div>
            </div>
            <Link to="/assignments" className="stat-link">Review →</Link>
          </div>

          <div className="stat-card completed">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <div className="stat-number">{stats.completedTasks}</div>
              <div className="stat-label">Completed</div>
            </div>
            <Link to="/assignments" className="stat-link">View →</Link>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2 className="section-title">Quick Actions</h2>
        <div className="actions-grid">
          <Link to="/students" className="action-card">
            <div className="action-icon">👤➕</div>
            <div className="action-content">
              <h3>Add Student</h3>
              <p>Register a new student in your class</p>
            </div>
          </Link>

          <Link to="/tasks" className="action-card">
            <div className="action-icon">�</div>
            <div className="action-content">
              <h3>Create Task/Reminder</h3>
              <p>Send notifications and reminders to students</p>
            </div>
          </Link>

          <Link to="/assignment-management" className="action-card">
            <div className="action-icon">📚</div>
            <div className="action-content">
              <h3>Create Assignment</h3>
              <p>Create graded assignments with file uploads</p>
            </div>
          </Link>

          <Link to="/assignments" className="action-card">
            <div className="action-icon">📊</div>
            <div className="action-content">
              <h3>Review Submissions</h3>
              <p>Check and grade student submissions</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="recent-activity">
        <div className="activity-section">
          <h3>Recent Tasks</h3>
          {recentTasks.length === 0 ? (
            <p className="no-data">No tasks created yet</p>
          ) : (
            <div className="activity-list">
              {recentTasks.map(task => (
                <div key={task._id} className="activity-item">
                  <div className="activity-info">
                    <strong>{task.title}</strong>
                    <span className="activity-meta">
                      {task.dueDate ? `Due: ${new Date(task.dueDate).toLocaleDateString()}` : 'No due date'}
                    </span>
                  </div>
                  <span className={`status-badge ${task.status}`}>
                    {task.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="activity-section">
          <h3>Recent Students</h3>
          {recentStudents.length === 0 ? (
            <p className="no-data">No students added yet</p>
          ) : (
            <div className="activity-list">
              {recentStudents.map(student => (
                <div key={student._id} className="activity-item">
                  <div className="activity-info">
                    <strong>{student.name}</strong>
                    <span className="activity-meta">
                      ID: {student.studentId}
                    </span>
                  </div>
                  <span className="student-info">
                    {student.course || 'Course not specified'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;