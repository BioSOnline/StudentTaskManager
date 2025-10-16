import React, { useState, useEffect } from 'react';
import { assignmentService } from '../services/assignmentService';
import { taskService } from '../services/taskService';
import '../styles/AssignmentUpload.css';

const AssignmentUpload = ({ task, onClose, onSubmissionSuccess, onUploadComplete }) => {
  // All hooks must be declared before any conditional returns
  const [files, setFiles] = useState([]);
  const [submissionText, setSubmissionText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const [selectedTask, setSelectedTask] = useState(task || null);
  const [availableTasks, setAvailableTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

  useEffect(() => {
    if (!task) {
      loadAvailableTasks();
    }
  }, [task]);

  const loadAvailableTasks = async () => {
    setLoadingTasks(true);
    try {
      const tasks = await taskService.getTasks();
      setAvailableTasks(tasks);
    } catch (error) {
      console.error('Failed to load tasks:', error);
      setError('Failed to load available tasks');
    } finally {
      setLoadingTasks(false);
    }
  };

  const handleFileSelect = (selectedFiles) => {
    const fileArray = Array.from(selectedFiles);
    const validFiles = [];
    
    fileArray.forEach(file => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      const allowedTypes = [
        'application/pdf',
        'image/jpeg', 'image/jpg', 'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'application/zip', 'application/x-rar-compressed',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      
      if (file.size > maxSize) {
        setError(`File "${file.name}" is too large. Maximum size is 10MB.`);
        return;
      }
      
      const fileExtension = file.name.split('.').pop().toLowerCase();
      const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'txt', 'zip', 'rar', 'ppt', 'pptx', 'xls', 'xlsx'];
      
      if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
        setError(`File "${file.name}" is not a supported format.`);
        return;
      }
      
      // Check for duplicates
      const isDuplicate = files.some(existingFile => 
        existingFile.name === file.name && existingFile.size === file.size
      );
      
      if (isDuplicate) {
        setError(`File "${file.name}" is already selected.`);
        return;
      }
      
      validFiles.push(file);
    });

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
      setError('');
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedTask) {
      setError('Please select a task to submit to.');
      return;
    }

    if (files.length === 0 && !submissionText.trim()) {
      setError('Please upload at least one file or provide submission text.');
      return;
    }

    if (files.length > 5) {
      setError('Maximum 5 files allowed per submission.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError('');

    try {
      const formData = new FormData();
      formData.append('taskId', selectedTask._id);
      formData.append('submissionText', submissionText);
      
      files.forEach(file => {
        formData.append('files', file);
      });

      // Use the assignment service with proper progress tracking
      const response = await assignmentService.uploadAssignment(formData, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);
      });

      if (onSubmissionSuccess) {
        onSubmissionSuccess(response.submission);
      }
      if (onUploadComplete) {
        onUploadComplete();
      }
      onClose();

    } catch (error) {
      console.error('Submission error:', error);
      setError(error.message || 'Failed to submit assignment');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    const icons = {
      pdf: '📄',
      doc: '📝', docx: '📝',
      txt: '📄',
      jpg: '🖼️', jpeg: '🖼️', png: '🖼️',
      zip: '📦', rar: '📦',
      ppt: '📊', pptx: '📊',
      xls: '📈', xlsx: '📈'
    };
    return icons[extension] || '📎';
  };

  const getDueDateStatus = () => {
    if (!selectedTask || !selectedTask.dueDate) return null;
    
    const now = new Date();
    const dueDate = new Date(selectedTask.dueDate);
    const diffTime = dueDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { status: 'overdue', text: `${Math.abs(diffDays)} days overdue`, color: '#dc3545' };
    } else if (diffDays === 0) {
      return { status: 'due-today', text: 'Due today', color: '#fd7e14' };
    } else if (diffDays <= 2) {
      return { status: 'due-soon', text: `Due in ${diffDays} day${diffDays > 1 ? 's' : ''}`, color: '#ffc107' };
    } else {
      return { status: 'due-later', text: `Due in ${diffDays} days`, color: '#28a745' };
    }
  };

  const dueDateStatus = getDueDateStatus();

  return (
    <div className="modal-overlay">
      <div className="modal-content assignment-upload-modal">
        <div className="modal-header">
          <h2>Submit Assignment</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {!selectedTask ? (
          <div className="task-selection">
            <h3>Select Task</h3>
            {loadingTasks ? (
              <div className="loading">Loading tasks...</div>
            ) : availableTasks.length === 0 ? (
              <div className="no-tasks">
                <p>No tasks available for assignment submission.</p>
              </div>
            ) : (
              <div className="task-selector">
                <label htmlFor="task-select">Choose a task to submit to:</label>
                <select
                  id="task-select"
                  onChange={(e) => {
                    const taskId = e.target.value;
                    const task = availableTasks.find(t => t._id === taskId);
                    setSelectedTask(task);
                  }}
                  value={selectedTask?._id || ''}
                >
                  <option value="">Select a task...</option>
                  {availableTasks.map(task => (
                    <option key={task._id} value={task._id}>
                      {task.title} {task.assignedTo ? `(${task.assignedTo.name})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        ) : (
          <div className="task-info">
            <h3>{selectedTask.title}</h3>
            {selectedTask.description && (
              <p className="task-description">{selectedTask.description}</p>
            )}
            <div className="task-details">
              {selectedTask.dueDate && (
                <span 
                  className={`due-date due-${dueDateStatus?.status}`}
                  style={{ color: dueDateStatus?.color }}
                >
                  📅 {dueDateStatus?.text}
                </span>
              )}
              <span className={`priority-badge priority-${selectedTask.priority}`}>
                {selectedTask.priority?.toUpperCase()}
              </span>
              <span className="category-badge">
                {selectedTask.category}
              </span>
            </div>
            {!task && (
              <button 
                type="button" 
                className="change-task-btn"
                onClick={() => setSelectedTask(null)}
              >
                Change Task
              </button>
            )}
          </div>
        )}

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {selectedTask && (
          <form onSubmit={handleSubmit} className="assignment-form">
          {/* File Upload Area */}
          <div 
            className={`file-upload-area ${dragActive ? 'drag-active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="upload-content">
              <div className="upload-icon">📁</div>
              <p>Drag and drop files here or</p>
              <input
                type="file"
                multiple
                onChange={(e) => handleFileSelect(e.target.files)}
                className="file-input"
                id="file-input"
                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.txt,.zip,.rar,.ppt,.pptx,.xls,.xlsx"
                disabled={uploading}
              />
              <label htmlFor="file-input" className="file-input-label">
                Choose Files
              </label>
              <p className="file-info">
                Max 10MB per file • Max 5 files • PDF, DOC, Images, ZIP, PPT, XLS allowed
              </p>
            </div>
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="upload-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <span className="progress-text">Uploading... {uploadProgress}%</span>
            </div>
          )}

          {/* Selected Files */}
          {files.length > 0 && (
            <div className="selected-files">
              <h4>Selected Files ({files.length}/5)</h4>
              <div className="files-list">
                {files.map((file, index) => (
                  <div key={index} className="file-item">
                    <div className="file-info">
                      <span className="file-icon">{getFileIcon(file.name)}</span>
                      <div className="file-details">
                        <span className="file-name">{file.name}</span>
                        <span className="file-size">{formatFileSize(file.size)}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="remove-file-btn"
                      disabled={uploading}
                      title="Remove file"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submission Text */}
          <div className="form-group">
            <label htmlFor="submissionText">
              Additional Notes {files.length === 0 && <span className="required">*</span>}
            </label>
            <textarea
              id="submissionText"
              value={submissionText}
              onChange={(e) => setSubmissionText(e.target.value)}
              rows="4"
              placeholder="Add any notes about your submission, explain your work, or ask questions..."
              className="submission-textarea"
              disabled={uploading}
            />
          </div>

          {/* Submit Button */}
          <div className="form-actions">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
              disabled={uploading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={uploading || (files.length === 0 && !submissionText.trim())}
            >
              {uploading ? `Submitting... ${uploadProgress}%` : 'Submit Assignment'}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
};

export default AssignmentUpload;