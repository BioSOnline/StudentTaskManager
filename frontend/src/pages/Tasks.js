import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { taskService } from '../services/taskService';
import { studentService } from '../services/studentService';
import ModernTaskForm from '../components/ModernTaskForm';
import TaskItem from '../components/TaskItem';
import Loading from '../components/Loading';
import { useToast } from '../context/ToastContext';
import '../styles/Tasks.css';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    priority: '',
    studentId: ''
  });
  
  const toast = useToast();
  
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get URL parameters for student filtering
  const urlParams = new URLSearchParams(location.search);
  const preselectedStudentId = urlParams.get('studentId');
  const preselectedStudentName = urlParams.get('studentName');

  useEffect(() => {
    fetchTasks();
    fetchStudents();
    
    // Set initial student filter if coming from student page
    if (preselectedStudentId) {
      setFilters(prev => ({ ...prev, studentId: preselectedStudentId }));
    }
  }, [preselectedStudentId]);

  useEffect(() => {
    applyFilters();
  }, [tasks, filters]);

  const fetchTasks = async () => {
    try {
      const tasksData = await taskService.getTasks();
      setTasks(tasksData);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const studentsData = await studentService.getStudents();
      setStudents(studentsData);
    } catch (error) {
      console.error('Failed to fetch students:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...tasks];

    if (filters.status) {
      filtered = filtered.filter(task => task.status === filters.status);
    }
    if (filters.category) {
      filtered = filtered.filter(task => task.category === filters.category);
    }
    if (filters.priority) {
      filtered = filtered.filter(task => task.priority === filters.priority);
    }
    if (filters.studentId) {
      filtered = filtered.filter(task => task.assignedTo?._id === filters.studentId);
    }

    setFilteredTasks(filtered);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleCreateTask = async (taskData) => {
    try {
      const newTask = await taskService.createTask(taskData);
      setTasks(prev => [newTask, ...prev]);
      setShowForm(false);
      toast.showSuccess('✅ Assignment created successfully!');
    } catch (error) {
      console.error('Failed to create task:', error);
      toast.showError(error.response?.data?.message || 'Failed to create assignment');
    }
  };

  const handleUpdateTask = async (taskData) => {
    try {
      const updatedTask = await taskService.updateTask(editingTask._id, taskData);
      setTasks(prev => prev.map(task => 
        task._id === editingTask._id ? updatedTask : task
      ));
      setEditingTask(null);
      setShowForm(false);
      toast.showSuccess('✅ Assignment updated successfully!');
    } catch (error) {
      console.error('Failed to update task:', error);
      toast.showError(error.response?.data?.message || 'Failed to update assignment');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this assignment?')) {
      try {
        await taskService.deleteTask(taskId);
        setTasks(prev => prev.filter(task => task._id !== taskId));
        toast.showSuccess('🗑️ Assignment deleted successfully!');
      } catch (error) {
        console.error('Failed to delete task:', error);
        toast.showError('Failed to delete assignment');
      }
    }
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingTask(null);
  };

  if (loading) {
    return <Loading text="Loading assignments..." />;
  }

  return (
    <div className="tasks-page">
      <div className="tasks-header">
        <h1>
          {preselectedStudentName ? `Tasks for ${preselectedStudentName}` : 'My Tasks'}
        </h1>
        <div className="header-actions">
          {preselectedStudentName && (
            <button 
              className="btn btn-secondary" 
              onClick={() => navigate('/students')}
            >
              ← Back to Students
            </button>
          )}
          <button 
            className="btn btn-primary" 
            onClick={() => setShowForm(true)}
          >
            + Add New Task
          </button>
        </div>
      </div>

      <div className="tasks-filters">
        <select
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>

        <select
          value={filters.category}
          onChange={(e) => handleFilterChange('category', e.target.value)}
        >
          <option value="">All Categories</option>
          <option value="homework">Homework</option>
          <option value="project">Project</option>
          <option value="exam">Exam</option>
          <option value="assignment">Assignment</option>
          <option value="other">Other</option>
        </select>

        <select
          value={filters.priority}
          onChange={(e) => handleFilterChange('priority', e.target.value)}
        >
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>

        <select
          value={filters.studentId}
          onChange={(e) => handleFilterChange('studentId', e.target.value)}
        >
          <option value="">All Students</option>
          {students.map(student => (
            <option key={student._id} value={student._id}>
              {student.name} ({student.studentId})
            </option>
          ))}
        </select>
      </div>

      <div className="tasks-content">
        {filteredTasks.length === 0 ? (
          <div className="empty-state">
            <p>
              {tasks.length === 0 
                ? "No tasks yet. Create your first task to get started!" 
                : "No tasks match your current filters."
              }
            </p>
          </div>
        ) : (
          <div className="tasks-grid">
            {filteredTasks.map(task => (
              <TaskItem
                key={task._id}
                task={task}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
              />
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <ModernTaskForm
          task={editingTask}
          preselectedStudentId={preselectedStudentId}
          onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
};

export default Tasks;