import React, { useState, useEffect } from 'react';
import { studentService } from '../services/studentService';
import '../styles/TaskForm.css';

const EnhancedTaskForm = ({ task, onSubmit, onClose, preselectedStudentId = null }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructions: '',
    assignedTo: preselectedStudentId || '',
    category: 'assignment',
    priority: 'medium',
    status: 'pending',
    dueDate: '',
    submissionFormat: 'file',
    allowedFileTypes: ['pdf', 'doc', 'docx'],
    maxFileSize: 10
  });
  const [attachments, setAttachments] = useState([]);
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        instructions: task.instructions || '',
        assignedTo: task.assignedTo?._id || preselectedStudentId || '',
        category: task.category || 'assignment',
        priority: task.priority || 'medium',
        status: task.status || 'pending',
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
        submissionFormat: task.submissionFormat || 'file',
        allowedFileTypes: task.allowedFileTypes || ['pdf', 'doc', 'docx'],
        maxFileSize: task.maxFileSize ? task.maxFileSize / (1024 * 1024) : 10
      });
      setAttachments(task.attachments || []);
    } else if (preselectedStudentId) {
      setFormData(prev => ({ ...prev, assignedTo: preselectedStudentId }));
    }
  }, [task, preselectedStudentId]);

  const fetchStudents = async () => {
    try {
      const studentsData = await studentService.getStudents();
      setStudents(studentsData);
    } catch (error) {
      console.error('Failed to fetch students:', error);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      if (name === 'allowedFileTypes') {
        setFormData(prev => ({
          ...prev,
          allowedFileTypes: checked 
            ? [...prev.allowedFileTypes, value]
            : prev.allowedFileTypes.filter(type => type !== value)
        }));
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  };

  const handleFiles = (files) => {
    const validFiles = files.filter(file => {
      const extension = file.name.split('.').pop().toLowerCase();
      const validTypes = ['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png', 'gif'];
      return validTypes.includes(extension) && file.size <= 10 * 1024 * 1024; // 10MB
    });

    const newAttachments = validFiles.map(file => ({
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    }));

    setAttachments(prev => [...prev, ...newAttachments]);
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
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
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
    setUploading(true);

    try {
      const taskData = {
        ...formData,
        maxFileSize: formData.maxFileSize * 1024 * 1024, // Convert MB to bytes
        attachments: attachments
      };

      await onSubmit(taskData);
    } catch (error) {
      console.error('Failed to submit task:', error);
    } finally {
      setUploading(false);
    }
  };

  const fileTypeOptions = [
    { value: 'pdf', label: 'PDF Documents' },
    { value: 'doc', label: 'Word Documents (.doc)' },
    { value: 'docx', label: 'Word Documents (.docx)' },
    { value: 'txt', label: 'Text Files' },
    { value: 'jpg', label: 'JPEG Images' },
    { value: 'jpeg', label: 'JPEG Images' },
    { value: 'png', label: 'PNG Images' },
    { value: 'gif', label: 'GIF Images' }
  ];

  return (
    <div className="modal-overlay">
      <div className="enhanced-task-form">
        <div className="form-header">
          <h2>{task ? 'Edit Assignment' : 'Create New Assignment'}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="task-form-content">
          {/* Basic Information */}
          <div className="form-section">
            <h3>📝 Basic Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="title">Assignment Title *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder="Enter assignment title"
                />
              </div>

              <div className="form-group">
                <label htmlFor="category">Category</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                >
                  <option value="assignment">Assignment</option>
                  <option value="homework">Homework</option>
                  <option value="project">Project</option>
                  <option value="exam">Exam</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="priority">Priority</label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="dueDate">Due Date</label>
                <input
                  type="date"
                  id="dueDate"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="assignedTo">Assign to Student</label>
              {loadingStudents ? (
                <div className="loading">Loading students...</div>
              ) : (
                <select
                  id="assignedTo"
                  name="assignedTo"
                  value={formData.assignedTo}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select a student</option>
                  {students.map(student => (
                    <option key={student._id} value={student._id}>
                      {student.name} ({student.studentId})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                placeholder="Brief description of the assignment"
              />
            </div>

            <div className="form-group">
              <label htmlFor="instructions">Detailed Instructions</label>
              <textarea
                id="instructions"
                name="instructions"
                value={formData.instructions}
                onChange={handleChange}
                rows="5"
                placeholder="Provide detailed instructions for the assignment..."
              />
            </div>
          </div>

          {/* File Attachments */}
          <div className="form-section">
            <h3>📎 Assignment Materials</h3>
            
            <div 
              className={`file-drop-zone ${dragActive ? 'drag-active' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="drop-zone-content">
                <div className="drop-zone-icon">📁</div>
                <p>Drag and drop files here or</p>
                <label className="file-select-btn">
                  Choose Files
                  <input
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                    style={{ display: 'none' }}
                  />
                </label>
                <p className="file-info">
                  Supported: PDF, DOC, DOCX, TXT, JPG, PNG, GIF (Max 10MB each)
                </p>
              </div>
            </div>

            {attachments.length > 0 && (
              <div className="attachments-list">
                <h4>Attached Files:</h4>
                {attachments.map((attachment, index) => (
                  <div key={index} className="attachment-item">
                    <div className="attachment-info">
                      <span className="attachment-name">{attachment.name}</span>
                      <span className="attachment-size">{formatFileSize(attachment.size)}</span>
                    </div>
                    <button
                      type="button"
                      className="remove-attachment"
                      onClick={() => removeAttachment(index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submission Settings */}
          <div className="form-section">
            <h3>⚙️ Submission Settings</h3>
            
            <div className="form-group">
              <label htmlFor="submissionFormat">Submission Format</label>
              <select
                id="submissionFormat"
                name="submissionFormat"
                value={formData.submissionFormat}
                onChange={handleChange}
              >
                <option value="file">File Upload Only</option>
                <option value="text">Text Response Only</option>
                <option value="both">Both File and Text</option>
              </select>
            </div>

            <div className="form-group">
              <label>Allowed File Types for Student Submissions</label>
              <div className="checkbox-grid">
                {fileTypeOptions.map(option => (
                  <label key={option.value} className="checkbox-item">
                    <input
                      type="checkbox"
                      name="allowedFileTypes"
                      value={option.value}
                      checked={formData.allowedFileTypes.includes(option.value)}
                      onChange={handleChange}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="maxFileSize">Max File Size (MB)</label>
              <input
                type="number"
                id="maxFileSize"
                name="maxFileSize"
                value={formData.maxFileSize}
                onChange={handleChange}
                min="1"
                max="50"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <span className="spinner"></span>
                  {task ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                task ? 'Update Assignment' : 'Create Assignment'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EnhancedTaskForm;