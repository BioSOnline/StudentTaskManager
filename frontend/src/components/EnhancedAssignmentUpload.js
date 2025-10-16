import React, { useState, useEffect } from 'react';
import { assignmentService } from '../services/assignmentService';
import { taskService } from '../services/taskService';
import '../styles/AssignmentUpload.css';

const EnhancedAssignmentUpload = ({ task, onClose, onSubmissionSuccess }) => {
  const [files, setFiles] = useState([]);
  const [submissionText, setSubmissionText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedTask, setSelectedTask] = useState(task || null);
  const [availableTasks, setAvailableTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [submissionType, setSubmissionType] = useState('file');

  useEffect(() => {
    if (!task) {
      loadAvailableTasks();
    } else {
      // Set submission type based on task requirements
      setSubmissionType(task.submissionFormat || 'file');
    }
  }, [task]);

  const loadAvailableTasks = async () => {
    setLoadingTasks(true);
    try {
      const tasks = await taskService.getTasks();
      // Filter tasks that are assigned to current user and not completed
      const pendingTasks = tasks.filter(t => 
        t.status === 'pending' || t.status === 'in-progress'
      );
      setAvailableTasks(pendingTasks);
    } catch (error) {
      console.error('Failed to load tasks:', error);
      setError('Failed to load available tasks');
    } finally {
      setLoadingTasks(false);
    }
  };

  const getAcceptedFileTypes = () => {
    if (!selectedTask || !selectedTask.allowedFileTypes) {
      return '.pdf,.doc,.docx,.txt,.jpg,.jpeg,.png';
    }
    
    const typeMap = {
      'pdf': '.pdf',
      'doc': '.doc',
      'docx': '.docx',
      'txt': '.txt',
      'jpg': '.jpg',
      'jpeg': '.jpeg',
      'png': '.png',
      'gif': '.gif'
    };
    
    return selectedTask.allowedFileTypes.map(type => typeMap[type]).join(',');
  };

  const validateFile = (file) => {
    if (!selectedTask) return { valid: true };

    const maxSize = selectedTask.maxFileSize || 10 * 1024 * 1024; // Default 10MB
    const allowedTypes = selectedTask.allowedFileTypes || ['pdf', 'doc', 'docx'];
    
    // Check file size
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File "${file.name}" is too large. Maximum size is ${formatFileSize(maxSize)}.`
      };
    }

    // Check file type
    const extension = file.name.split('.').pop().toLowerCase();
    if (!allowedTypes.includes(extension)) {
      return {
        valid: false,
        error: `File type "${extension}" is not allowed. Allowed types: ${allowedTypes.join(', ')}.`
      };
    }

    return { valid: true };
  };

  const handleFileSelect = (selectedFiles) => {
    const fileArray = Array.from(selectedFiles);
    const validFiles = [];
    const errors = [];
    
    fileArray.forEach(file => {
      const validation = validateFile(file);
      if (validation.valid) {
        const fileWithPreview = {
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
          id: Date.now() + Math.random()
        };
        validFiles.push(fileWithPreview);
      } else {
        errors.push(validation.error);
      }
    });

    if (errors.length > 0) {
      setError(errors.join(' '));
    } else {
      setError('');
    }

    setFiles(prev => [...prev, ...validFiles]);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
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

  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedTask) {
      setError('Please select a task');
      return;
    }

    // Validate submission based on task requirements
    const submissionFormat = selectedTask.submissionFormat || 'file';
    
    if (submissionFormat === 'file' && files.length === 0) {
      setError('Please select at least one file to upload');
      return;
    }
    
    if (submissionFormat === 'text' && !submissionText.trim()) {
      setError('Please provide a text response');
      return;
    }
    
    if (submissionFormat === 'both' && files.length === 0 && !submissionText.trim()) {
      setError('Please provide either files or a text response');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('taskId', selectedTask._id);
      formData.append('submissionText', submissionText);
      
      files.forEach((fileObj) => {
        formData.append('files', fileObj.file);
      });

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const response = await assignmentService.submitAssignment(formData);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setSuccess('Assignment submitted successfully! 🎉');
      
      // Clear form
      setFiles([]);
      setSubmissionText('');
      setUploadProgress(0);
      
      // Notify parent component
      if (onSubmissionSuccess) {
        onSubmissionSuccess(response);
      }
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (error) {
      console.error('Upload failed:', error);
      setError(error.response?.data?.message || 'Failed to submit assignment. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const getSubmissionInstructions = () => {
    if (!selectedTask) return '';
    
    const format = selectedTask.submissionFormat || 'file';
    const allowedTypes = selectedTask.allowedFileTypes || ['pdf', 'doc', 'docx'];
    const maxSize = selectedTask.maxFileSize || 10 * 1024 * 1024;
    
    let instructions = '';
    
    if (format === 'file') {
      instructions = `Upload your assignment files. Allowed formats: ${allowedTypes.join(', ').toUpperCase()}. Max size: ${formatFileSize(maxSize)} per file.`;
    } else if (format === 'text') {
      instructions = 'Provide your assignment response in the text area below.';
    } else {
      instructions = `You can submit files (${allowedTypes.join(', ').toUpperCase()}) and/or provide a text response. Max file size: ${formatFileSize(maxSize)} per file.`;
    }
    
    return instructions;
  };

  return (
    <div className="modal-overlay">
      <div className="enhanced-assignment-upload">
        <div className="upload-header">
          <h2>📤 Submit Assignment</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="upload-content">
          {/* Task Selection */}
          {!task && (
            <div className="form-section">
              <h3>Select Assignment</h3>
              {loadingTasks ? (
                <div className="loading">Loading assignments...</div>
              ) : (
                <select
                  value={selectedTask?._id || ''}
                  onChange={(e) => {
                    const task = availableTasks.find(t => t._id === e.target.value);
                    setSelectedTask(task);
                    setSubmissionType(task?.submissionFormat || 'file');
                  }}
                  required
                  className="task-select"
                >
                  <option value="">Choose an assignment...</option>
                  {availableTasks.map(task => (
                    <option key={task._id} value={task._id}>
                      {task.title} - Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {selectedTask && (
            <>
              {/* Task Details */}
              <div className="task-details">
                <h3>📋 {selectedTask.title}</h3>
                {selectedTask.description && (
                  <p className="task-description">{selectedTask.description}</p>
                )}
                {selectedTask.instructions && (
                  <div className="task-instructions">
                    <h4>Instructions:</h4>
                    <p>{selectedTask.instructions}</p>
                  </div>
                )}
                <div className="submission-info">
                  <p className="submission-instructions">{getSubmissionInstructions()}</p>
                </div>
              </div>

              {/* File Upload Section */}
              {(submissionType === 'file' || submissionType === 'both') && (
                <div className="form-section">
                  <h3>📁 File Upload</h3>
                  
                  <div 
                    className={`file-drop-zone ${dragActive ? 'drag-active' : ''}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <div className="drop-zone-content">
                      <div className="drop-zone-icon">📁</div>
                      <p>Drag and drop your files here or</p>
                      <label className="file-select-btn">
                        Choose Files
                        <input
                          type="file"
                          multiple
                          onChange={(e) => handleFileSelect(e.target.files)}
                          accept={getAcceptedFileTypes()}
                          style={{ display: 'none' }}
                        />
                      </label>
                      <p className="file-info">
                        {selectedTask.allowedFileTypes?.join(', ').toUpperCase() || 'PDF, DOC, DOCX'} 
                        {' '}(Max {formatFileSize(selectedTask.maxFileSize || 10 * 1024 * 1024)} each)
                      </p>
                    </div>
                  </div>

                  {/* File List */}
                  {files.length > 0 && (
                    <div className="files-list">
                      <h4>Selected Files:</h4>
                      {files.map((fileObj) => (
                        <div key={fileObj.id} className="file-item">
                          <div className="file-info">
                            <span className="file-name">{fileObj.name}</span>
                            <span className="file-size">{formatFileSize(fileObj.size)}</span>
                          </div>
                          {fileObj.preview && (
                            <img src={fileObj.preview} alt="Preview" className="file-preview" />
                          )}
                          <button
                            type="button"
                            className="remove-file-btn"
                            onClick={() => removeFile(fileObj.id)}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Text Response Section */}
              {(submissionType === 'text' || submissionType === 'both') && (
                <div className="form-section">
                  <h3>✏️ Text Response</h3>
                  <textarea
                    value={submissionText}
                    onChange={(e) => setSubmissionText(e.target.value)}
                    placeholder="Enter your assignment response here..."
                    rows="8"
                    className="text-response"
                    required={submissionType === 'text'}
                  />
                </div>
              )}

              {/* Upload Progress */}
              {uploading && (
                <div className="upload-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p>Uploading... {uploadProgress}%</p>
                </div>
              )}

              {/* Messages */}
              {error && (
                <div className="error-message">
                  <span>❌</span>
                  {error}
                </div>
              )}

              {success && (
                <div className="success-message">
                  <span>✅</span>
                  {success}
                </div>
              )}

              {/* Form Actions */}
              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={onClose}
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={uploading || (!files.length && !submissionText.trim())}
                >
                  {uploading ? (
                    <>
                      <span className="spinner"></span>
                      Submitting...
                    </>
                  ) : (
                    'Submit Assignment'
                  )}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default EnhancedAssignmentUpload;