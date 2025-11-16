import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { taskService } from '../services/taskService';
import AssignmentUpload from '../components/AssignmentUpload';
import LiquidEther from '../components/LiquidEther';
import { LayoutTextFlip } from '../components/ui/LayoutTextFlip';
import '../styles/Dashboard.css';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    fetchMyTasks();
  }, []);

  const fetchMyTasks = async () => {
    try {
      setLoading(true);
      // For now, get all tasks - later we'll filter by student assignment
      const tasks = await taskService.getTasks();
      setMyTasks(tasks);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTaskStats = () => {
    const pending = myTasks.filter(task => task.status === 'pending').length;
    const inProgress = myTasks.filter(task => task.status === 'in-progress').length;
    const completed = myTasks.filter(task => task.status === 'completed').length;
    const overdue = myTasks.filter(task => 
      task.status !== 'completed' && task.dueDate && new Date(task.dueDate) < new Date()
    ).length;

    return { pending, inProgress, completed, overdue };
  };

  const { pending, inProgress, completed, overdue } = getTaskStats();

  // Glass-like stat cards that blend with background
  const statCards = [
    {
      label: 'Pending Tasks',
      value: pending,
      color: '#00ff88',
    },
    {
      label: 'In Progress',
      value: inProgress,
      color: '#00d4ff',
    },
    {
      label: 'Completed',
      value: completed,
      color: '#7c3aed',
    },
    {
      label: 'Overdue',
      value: overdue,
      color: '#ff6b6b',
    },
  ];

  const handleTaskAction = (task, action) => {
    if (action === 'submit') {
      setSelectedTask(task);
      setShowUpload(true);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">Loading your dashboard...</div>
      </div>
    );
  }

  return (
    <div className="student-dashboard">
      {/* Animated Liquid Background */}
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100vw', 
        height: '100vh', 
        zIndex: 0,
        opacity: 0.35,
        pointerEvents: 'none'
      }}>
        <LiquidEther
          colors={['#00ff88', '#00d4ff', '#7c3aed']}
          mouseForce={25}
          cursorSize={120}
          resolution={0.5}
          autoDemo={true}
          autoSpeed={0.4}
          autoIntensity={2.0}
        />
      </div>

      <div className="student-header" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ marginBottom: '1rem' }}>
          <LayoutTextFlip
            text="Track Your "
            words={[" Progress", " Tasks", "Assignments", "Success"]}
            duration={3000}
          />
        </div>
        <h2 className="student-welcome">Welcome back, {user.name}</h2>
        <div className="student-info">
          {user.studentId && (
            <div className="student-info-item">
              <span>Student ID: {user.studentId}</span>
            </div>
          )}
          {user.course && (
            <div className="student-info-item">
              <span>{user.course}</span>
            </div>
          )}
          {user.year && (
            <div className="student-info-item">
              <span>{user.year}</span>
            </div>
          )}
        </div>
      </div>

      {/* Glass Stats Cards - Blended with background */}
      <div className="glass-stats-grid" style={{ position: 'relative', zIndex: 1 }}>
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="glass-stat-card"
            style={{
              animationDelay: `${index * 0.1}s`,
            }}
          >
            <div className="glass-value">{stat.value}</div>
            <div className="glass-label">{stat.label}</div>
            <div className="glass-glow" style={{ background: `radial-gradient(circle, ${stat.color}20 0%, transparent 70%)` }}></div>
          </div>
        ))}
      </div>

      {/* Tasks Section */}
      <div className="tasks-section">
        <div className="section-header">
          <h2 className="section-title">Your Tasks</h2>
          <Link to="/tasks" className="view-all-btn">View All Tasks →</Link>
        </div>
        
        {myTasks.length === 0 ? (
          <div className="no-tasks">
            <div className="no-tasks-icon">📝</div>
            <h3>No tasks assigned yet</h3>
            <p>Your teachers haven't assigned any tasks yet. Check back later!</p>
          </div>
        ) : (
          <div className="tasks-grid">
            {myTasks.slice(0, 6).map(task => (
              <div key={task._id} className="task-card">
                <div className="task-header">
                  <h3 className="task-title">{task.title}</h3>
                  <span className={`task-status ${task.status}`}>
                    {task.status.replace('-', ' ')}
                  </span>
                </div>
                
                <p className="task-description">{task.description}</p>
                
                <div className="task-meta">
                  {task.dueDate && (
                    <div className="task-due">
                       Due: {new Date(task.dueDate).toLocaleDateString()}
                    </div>
                  )}
                  <div className={`task-priority ${task.priority}`}>
                    {task.priority}
                  </div>
                  <div className="task-category">
                     {task.category}
                  </div>
                </div>

                <div className="task-actions">
                  <button 
                    className="task-action-btn task-action-primary"
                    onClick={() => handleTaskAction(task, 'submit')}
                  >
                     Submit Assignment
                  </button>
                  <button 
                    className="task-action-btn task-action-secondary"
                    onClick={() => handleTaskAction(task, 'view')}
                  >
                     View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assignment Upload Modal */}
      {showUpload && selectedTask && (
        <AssignmentUpload
          task={selectedTask}
          onClose={() => {
            setShowUpload(false);
            setSelectedTask(null);
          }}
          onSubmissionSuccess={() => {
            fetchMyTasks();
            setShowUpload(false);
            setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
};

export default StudentDashboard;