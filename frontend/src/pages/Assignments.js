import React, { useState, useEffect } from 'react';
import { assignmentService } from '../services/assignmentService';
import { taskService } from '../services/taskService';
import AssignmentUpload from '../components/AssignmentUpload';
import '../styles/Assignments.css';

const Assignments = () => {
  const [submissions, setSubmissions] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState('');
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [filters, setFilters] = useState({
    task: '',
    graded: 'all' // all, graded, ungraded
  });

  useEffect(() => {
    fetchTasks();
    fetchAllSubmissions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters]);

  const fetchTasks = async () => {
    try {
      const tasksData = await taskService.getTasks();
      setTasks(tasksData);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    }
  };

  const fetchAllSubmissions = async () => {
    setLoading(true);
    try {
      const submissionsData = await assignmentService.getAllSubmissions();
      setSubmissions(submissionsData);
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    // Filter submissions based on current filters
    // This would be implemented based on your filtering needs
  };

  const handleDownload = async (fileId, filename) => {
    try {
      await assignmentService.downloadSubmission(fileId, filename);
    } catch (error) {
      console.error('Failed to download submission:', error);
      alert('Failed to download file');
    }
  };

  const handleGradeUpdate = async (submissionId, grade, feedback) => {
    try {
      await assignmentService.updateGrade(submissionId, { grade, feedback });
      fetchAllSubmissions(); // Refresh submissions
    } catch (error) {
      console.error('Failed to update grade:', error);
      alert('Failed to update grade');
    }
  };

  const handleDelete = async (submissionId) => {
    if (window.confirm('Are you sure you want to delete this submission?')) {
      try {
        await assignmentService.deleteSubmission(submissionId);
        fetchAllSubmissions();
      } catch (error) {
        console.error('Failed to delete submission:', error);
        alert('Failed to delete submission');
      }
    }
  };

  const getTaskTitle = (taskId) => {
    const task = tasks.find(t => t._id === taskId);
    return task ? task.title : 'Unknown Task';
  };

  const groupedSubmissions = submissions.reduce((groups, submission) => {
    const taskId = submission.taskId;
    if (!groups[taskId]) {
      groups[taskId] = [];
    }
    groups[taskId].push(submission);
    return groups;
  }, {});

  if (loading) {
    return (
      <div className="assignments-page">
        <div className="loading">Loading assignments...</div>
      </div>
    );
  }

  return (
    <div className="assignments-page">
      <div className="assignments-header">
        <h1>Assignment Submissions</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setShowUpload(true)}
        >
          Upload Assignment
        </button>
      </div>

      <div className="assignments-filters">
        <div className="filter-group">
          <label htmlFor="task-filter">Filter by Task:</label>
          <select
            id="task-filter"
            value={filters.task}
            onChange={(e) => setFilters(prev => ({ ...prev, task: e.target.value }))}
          >
            <option value="">All Tasks</option>
            {tasks.map(task => (
              <option key={task._id} value={task._id}>
                {task.title}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="graded-filter">Filter by Status:</label>
          <select
            id="graded-filter"
            value={filters.graded}
            onChange={(e) => setFilters(prev => ({ ...prev, graded: e.target.value }))}
          >
            <option value="all">All Submissions</option>
            <option value="graded">Graded Only</option>
            <option value="ungraded">Ungraded Only</option>
          </select>
        </div>
      </div>

      <div className="assignments-content">
        {Object.keys(groupedSubmissions).length === 0 ? (
          <div className="no-assignments">
            <h3>No assignment submissions yet</h3>
            <p>Students can upload their assignments which will appear here for review and grading.</p>
          </div>
        ) : (
          <div className="assignments-groups">
            {Object.entries(groupedSubmissions).map(([taskId, taskSubmissions]) => (
              <div key={taskId} className="assignment-group">
                <div className="group-header">
                  <h3>{getTaskTitle(taskId)}</h3>
                  <span className="submission-count">
                    {taskSubmissions.length} submission{taskSubmissions.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="submissions-grid">
                  {taskSubmissions.map(submission => (
                    <div key={submission._id} className="submission-card">
                      <div className="submission-header">
                        <div className="student-info">
                          <strong>{submission.studentId?.name || 'Unknown Student'}</strong>
                          <span className="student-id">
                            ({submission.studentId?.studentId || 'N/A'})
                          </span>
                        </div>
                        <div className="submission-date">
                          {new Date(submission.submittedAt).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="submission-body">
                        <div className="file-info">
                          <span className="file-icon">📄</span>
                          <span className="file-name">{submission.filename}</span>
                        </div>

                        <div className="submission-actions">
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleDownload(submission.files?.[0]?.fileId, submission.filename)}
                          >
                            Download
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDelete(submission._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      <div className="submission-grading">
                        <div className="grade-display">
                          {submission.grade !== undefined ? (
                            <span className="grade-badge graded">
                              {submission.grade}/100
                            </span>
                          ) : (
                            <span className="grade-badge ungraded">
                              Not Graded
                            </span>
                          )}
                        </div>

                        <div className="grading-form">
                          <div className="grade-input">
                            <label>Grade:</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              placeholder="0-100"
                              defaultValue={submission.grade || ''}
                              onBlur={(e) => {
                                const grade = parseInt(e.target.value);
                                if (!isNaN(grade) && grade !== submission.grade) {
                                  handleGradeUpdate(submission._id, grade, submission.feedback || '');
                                }
                              }}
                            />
                          </div>
                          
                          <div className="feedback-input">
                            <label>Feedback:</label>
                            <textarea
                              placeholder="Provide feedback..."
                              defaultValue={submission.feedback || ''}
                              onBlur={(e) => {
                                const feedback = e.target.value;
                                if (feedback !== (submission.feedback || '')) {
                                  handleGradeUpdate(submission._id, submission.grade || 0, feedback);
                                }
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showUpload && (
        <AssignmentUpload 
          onClose={() => setShowUpload(false)}
          onUploadComplete={() => {
            setShowUpload(false);
            fetchAllSubmissions();
          }}
        />
      )}
    </div>
  );
};

export default Assignments;