import React, { useState, useEffect } from 'react';
import { assignmentService } from '../services/assignmentService';
import AssignmentUpload from './AssignmentUpload';
import '../styles/TaskItem.css';

const TaskItem = ({ task, onEdit, onDelete }) => {
  const [submissions, setSubmissions] = useState([]);
  const [showAssignments, setShowAssignments] = useState(false);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const getPriorityClass = (priority) => `priority-${priority}`;
  const getStatusClass = (status) => `status-${status.replace('-', '')}`;
  const getCategoryIcon = (category) => {
    const icons = {
      homework: '📝',
      project: '💼',
      exam: '📋',
      assignment: '📄',
      other: '📌'
    };
    return icons[category] || '📌';
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)} days overdue`, className: 'overdue' };
    } else if (diffDays === 0) {
      return { text: 'Due today', className: 'due-today' };
    } else if (diffDays === 1) {
      return { text: 'Due tomorrow', className: 'due-soon' };
    } else if (diffDays <= 7) {
      return { text: `Due in ${diffDays} days`, className: 'due-soon' };
    } else {
      return { text: date.toLocaleDateString(), className: 'due-later' };
    }
  };

  const dueDateInfo = task.dueDate ? formatDate(task.dueDate) : null;

  useEffect(() => {
    if (showAssignments) {
      fetchSubmissions();
    }
  }, [showAssignments, task._id]);

  const fetchSubmissions = async () => {
    setLoadingSubmissions(true);
    try {
      const submissionsData = await assignmentService.getSubmissions(task._id);
      setSubmissions(submissionsData);
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
      setSubmissions([]);
    } finally {
      setLoadingSubmissions(false);
    }
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
      fetchSubmissions(); // Refresh submissions
    } catch (error) {
      console.error('Failed to update grade:', error);
      alert('Failed to update grade');
    }
  };

  return (
    <div className={`task-item ${getStatusClass(task.status)}`}>
      <div className="task-header">
        <div className="task-category-icon">
          {getCategoryIcon(task.category)}
        </div>
        <div className="task-actions">
          <button
            className="action-btn assignments-btn"
            onClick={() => setShowAssignments(!showAssignments)}
            title="View submissions"
          >
            📎 {submissions.length > 0 && <span className="submission-count">{submissions.length}</span>}
          </button>
          <button
            className="action-btn edit-btn"
            onClick={() => onEdit(task)}
            title="Edit task"
          >
            ✏️
          </button>
          <button
            className="action-btn delete-btn"
            onClick={() => onDelete(task._id)}
            title="Delete task"
          >
            🗑️
          </button>
        </div>
      </div>

      <div className="task-body">
        <h3 className="task-title">{task.title}</h3>
        {task.assignedTo && (
          <div className="task-student">
            👤 {task.assignedTo.name} ({task.assignedTo.studentId})
          </div>
        )}
        {task.description && (
          <p className="task-description">{task.description}</p>
        )}
      </div>

      <div className="task-footer">
        <div className="task-tags">
          <span className={`task-category ${task.category}`}>
            {task.category}
          </span>
          <span className={`task-priority ${getPriorityClass(task.priority)}`}>
            {task.priority}
          </span>
          <span className={`task-status ${getStatusClass(task.status)}`}>
            {task.status.replace('-', ' ')}
          </span>
        </div>

        {dueDateInfo && (
          <div className={`task-due-date ${dueDateInfo.className}`}>
            {dueDateInfo.text}
          </div>
        )}
      </div>

      {showAssignments && (
        <div className="task-submissions">
          <div className="submissions-header">
            <h4>Assignment Submissions</h4>
            <button 
              className="close-submissions"
              onClick={() => setShowAssignments(false)}
            >
              ×
            </button>
          </div>
          
          {loadingSubmissions ? (
            <div className="loading">Loading submissions...</div>
          ) : submissions.length === 0 ? (
            <div className="no-submissions">
              <p>No submissions yet for this task.</p>
              <p>Students can upload their assignments using the assignment upload feature.</p>
            </div>
          ) : (
            <div className="submissions-list">
              {submissions.map(submission => (
                <div key={submission._id} className="submission-item">
                  <div className="submission-info">
                    <div className="submission-student">
                      👤 {submission.studentId?.name || 'Unknown Student'}
                    </div>
                    <div className="submission-file">
                      📄 {submission.filename}
                    </div>
                    <div className="submission-date">
                      📅 {new Date(submission.submittedAt).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="submission-actions">
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => handleDownload(submission.files?.[0]?.fileId, submission.filename)}
                    >
                      Download
                    </button>
                  </div>
                  
                  <div className="submission-grading">
                    <div className="grade-info">
                      {submission.grade !== undefined ? (
                        <span className="current-grade">Grade: {submission.grade}/100</span>
                      ) : (
                        <span className="no-grade">Not graded</span>
                      )}
                    </div>
                    
                    <div className="grade-form">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="Grade"
                        defaultValue={submission.grade || ''}
                        onBlur={(e) => {
                          const grade = parseInt(e.target.value);
                          if (!isNaN(grade) && grade !== submission.grade) {
                            handleGradeUpdate(submission._id, grade, submission.feedback || '');
                          }
                        }}
                      />
                      <textarea
                        placeholder="Feedback..."
                        defaultValue={submission.feedback || ''}
                        onBlur={(e) => {
                          const feedback = e.target.value;
                          if (feedback !== submission.feedback) {
                            handleGradeUpdate(submission._id, submission.grade || 0, feedback);
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskItem;