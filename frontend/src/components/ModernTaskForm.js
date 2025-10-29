import React, { useState, useEffect } from 'react';
import { studentService } from '../services/studentService';
import { DEPARTMENT_OPTIONS, YEARS } from '../constants/departments';
import '../styles/MinimalTheme.css';
import '../styles/ModernTaskForm.css';

const ModernTaskForm = ({ task, onSubmit, onClose, preselectedStudentId = null }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructions: '',
    assignedTo: preselectedStudentId || '',
    targetDepartment: '',
    targetYear: '',
    assignmentType: 'individual', // individual, department, year
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
  const [filteredStudents, setFilteredStudents] = useState([]);
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
        targetDepartment: task.targetDepartment || '',
        targetYear: task.targetYear || '',
        assignmentType: task.assignmentType || 'individual',
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

  // Filter students based on assignment type and targets
  useEffect(() => {
    let filtered = [...students];
    
    if (formData.assignmentType === 'department' && formData.targetDepartment) {
      filtered = students.filter(student => student.department === formData.targetDepartment);
    } else if (formData.assignmentType === 'year' && formData.targetYear) {
      filtered = students.filter(student => student.year === formData.targetYear);
    }
    
    setFilteredStudents(filtered);
  }, [students, formData.assignmentType, formData.targetDepartment, formData.targetYear]);

  const fetchStudents = async () => {
    try {
      setLoadingStudents(true);
      const response = await studentService.getStudents();
      setStudents(response.data || []);
      setFilteredStudents(response.data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Reset dependent fields when assignment type changes
    if (name === 'assignmentType') {
      setFormData(prev => ({
        ...prev,
        targetDepartment: '',
        targetYear: '',
        assignedTo: ''
      }));
    }
  };

  const handleFileTypeChange = (fileType) => {
    setFormData(prev => ({
      ...prev,
      allowedFileTypes: prev.allowedFileTypes.includes(fileType)
        ? prev.allowedFileTypes.filter(type => type !== fileType)
        : [...prev.allowedFileTypes, fileType]
    }));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFiles = (files) => {
    const validFiles = files.filter(file => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      return file.size <= maxSize;
    });

    setAttachments(prev => [...prev, ...validFiles.map(file => ({
      file,
      name: file.name,
      size: file.size,
      type: file.type
    }))]);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setUploading(true);
      
      const taskData = {
        ...formData,
        maxFileSize: formData.maxFileSize * 1024 * 1024, // Convert MB to bytes
        dueDate: formData.dueDate || null
      };

      // Handle multiple students for bulk assignment
      if (formData.assignmentType !== 'individual' && filteredStudents.length > 0) {
        taskData.assignedToMultiple = filteredStudents.map(student => student._id);
        delete taskData.assignedTo;
      }

      await onSubmit(taskData, attachments);
    } catch (error) {
      console.error('Error submitting task:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modern-task-form">
        <div className="form-header">
          <h2 className="form-title">
            {task ? 'Edit Assignment' : 'Create New Assignment'}
          </h2>
          <button 
            type="button" 
            onClick={onClose}
            className="close-button"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="task-form">
          {/* Basic Information */}
          <div className="form-section">
            <h3 className="section-title">Assignment Details</h3>
            
            <div className="form-group">
              <label htmlFor="title">Assignment Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                placeholder="Enter assignment title"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Brief description of the assignment"
                rows="3"
                className="form-textarea"
              />
            </div>

            <div className="form-group">
              <label htmlFor="instructions">Instructions</label>
              <textarea
                id="instructions"
                name="instructions"
                value={formData.instructions}
                onChange={handleInputChange}
                placeholder="Detailed instructions for students"
                rows="4"
                className="form-textarea"
              />
            </div>
          </div>

          {/* Assignment Target */}
          <div className="form-section">
            <h3 className="section-title">Assignment Target</h3>
            
            <div className="form-group">
              <label htmlFor="assignmentType">Assignment Type *</label>
              <select
                id="assignmentType"
                name="assignmentType"
                value={formData.assignmentType}
                onChange={handleInputChange}
                className="form-select"
                required
              >
                <option value="individual">Individual Student</option>
                <option value="department">Entire Department</option>
                <option value="year">Specific Year</option>
              </select>
            </div>

            {/* Individual Student Selection */}
            {formData.assignmentType === 'individual' && (
              <div className="form-group">
                <label htmlFor="assignedTo">Select Student *</label>
                <select
                  id="assignedTo"
                  name="assignedTo"
                  value={formData.assignedTo}
                  onChange={handleInputChange}
                  className="form-select"
                  required={formData.assignmentType === 'individual'}
                >
                  <option value="">Choose a student</option>
                  {students.map(student => (
                    <option key={student._id} value={student._id}>
                      {student.name} ({student.studentId}) - {student.department}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Department Selection */}
            {formData.assignmentType === 'department' && (
              <div className="form-group">
                <label htmlFor="targetDepartment">Department *</label>
                <select
                  id="targetDepartment"
                  name="targetDepartment"
                  value={formData.targetDepartment}
                  onChange={handleInputChange}
                  className="form-select"
                  required
                >
                  <option value="">Select Department</option>
                  {DEPARTMENT_OPTIONS.map(dept => (
                    <option key={dept.value} value={dept.value}>
                      {dept.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Year Selection */}
            {formData.assignmentType === 'year' && (
              <div className="form-group">
                <label htmlFor="targetYear">Year *</label>
                <select
                  id="targetYear"
                  name="targetYear"
                  value={formData.targetYear}
                  onChange={handleInputChange}
                  className="form-select"
                  required
                >
                  <option value="">Select Year</option>
                  {YEARS.map(year => (
                    <option key={year.value} value={year.label}>
                      {year.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Show filtered students count */}
            {formData.assignmentType !== 'individual' && filteredStudents.length > 0 && (
              <div className="info-box">
                <p>This assignment will be assigned to <strong>{filteredStudents.length}</strong> students</p>
              </div>
            )}
          </div>

          {/* Assignment Settings */}
          <div className="form-section">
            <h3 className="section-title">Assignment Settings</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="priority">Priority</label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="form-select"
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
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Allowed File Types</label>
              <div className="file-type-options">
                {['pdf', 'doc', 'docx', 'jpg', 'png', 'txt'].map(type => (
                  <label key={type} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.allowedFileTypes.includes(type)}
                      onChange={() => handleFileTypeChange(type)}
                    />
                    <span className="checkmark"></span>
                    {type.toUpperCase()}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* File Attachments */}
          <div className="form-section">
            <h3 className="section-title">Attachments</h3>
            
            <div 
              className={`file-upload-area ${dragActive ? 'drag-active' : ''}`}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onDragEnter={() => setDragActive(true)}
              onDragLeave={() => setDragActive(false)}
            >
              <div className="upload-content">
                <div className="upload-icon">📁</div>
                <p>Drag and drop files here or</p>
                <input
                  type="file"
                  multiple
                  onChange={(e) => handleFiles(Array.from(e.target.files))}
                  className="file-input"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="upload-button">
                  Choose Files
                </label>
              </div>
            </div>

            {attachments.length > 0 && (
              <div className="attachment-list">
                {attachments.map((attachment, index) => (
                  <div key={index} className="attachment-item">
                    <span className="attachment-name">{attachment.name}</span>
                    <span className="attachment-size">
                      {(attachment.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="remove-attachment"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={uploading}
            >
              {uploading ? 'Creating...' : (task ? 'Update Assignment' : 'Create Assignment')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModernTaskForm;