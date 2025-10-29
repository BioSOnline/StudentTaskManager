import React, { useState, useEffect } from 'react';
import { assignmentManagementService } from '../services/assignmentManagementService';
import { studentService } from '../services/studentService';
import { useToast } from '../context/ToastContext';
import Loading from '../components/Loading';
import '../styles/Assignments.css';

const AssignmentManagement = () => {
  const [assignments, setAssignments] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const toast = useToast();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructions: '',
    dueDate: '',
    maxMarks: 100,
    assignmentType: 'individual',
    assignedTo: '',
    targetDepartment: '',
    targetYear: '',
    allowedFileTypes: ['pdf', 'doc', 'docx'],
    maxFileSize: 10485760,
    submissionFormat: 'file',
    referenceFiles: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [assignmentsData, studentsData] = await Promise.all([
        assignmentManagementService.getAssignments(),
        studentService.getStudents()
      ]);
      setAssignments(assignmentsData);
      setStudents(studentsData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.showError('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({
      ...prev,
      referenceFiles: files
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingAssignment) {
        const updated = await assignmentManagementService.updateAssignment(
          editingAssignment._id,
          formData
        );
        setAssignments(prev => prev.map(a => a._id === updated._id ? updated : a));
        toast.showSuccess('Assignment updated successfully');
      } else {
        const newAssignment = await assignmentManagementService.createAssignment(formData);
        setAssignments(prev => [newAssignment, ...prev]);
        toast.showSuccess('Assignment created successfully');
      }
      handleCloseForm();
    } catch (error) {
      console.error('Failed to save assignment:', error);
      toast.showError('Failed to save assignment');
    }
  };

  const handleEdit = (assignment) => {
    setEditingAssignment(assignment);
    setFormData({
      title: assignment.title,
      description: assignment.description || '',
      instructions: assignment.instructions || '',
      dueDate: assignment.dueDate?.split('T')[0] || '',
      maxMarks: assignment.maxMarks || 100,
      assignmentType: assignment.assignmentType,
      assignedTo: assignment.assignedTo?._id || '',
      targetDepartment: assignment.targetDepartment || '',
      targetYear: assignment.targetYear || '',
      allowedFileTypes: assignment.allowedFileTypes || ['pdf', 'doc', 'docx'],
      maxFileSize: assignment.maxFileSize || 10485760,
      submissionFormat: assignment.submissionFormat || 'file',
      referenceFiles: []
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) return;
    
    try {
      await assignmentManagementService.deleteAssignment(id);
      setAssignments(prev => prev.filter(a => a._id !== id));
      toast.showSuccess('Assignment deleted successfully');
    } catch (error) {
      console.error('Failed to delete assignment:', error);
      toast.showError('Failed to delete assignment');
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingAssignment(null);
    setFormData({
      title: '',
      description: '',
      instructions: '',
      dueDate: '',
      maxMarks: 100,
      assignmentType: 'individual',
      assignedTo: '',
      targetDepartment: '',
      targetYear: '',
      allowedFileTypes: ['pdf', 'doc', 'docx'],
      maxFileSize: 10485760,
      submissionFormat: 'file',
      referenceFiles: []
    });
  };

  const downloadReferenceFile = async (assignmentId, fileIndex, filename) => {
    try {
      await assignmentManagementService.downloadReferenceFile(assignmentId, fileIndex, filename);
    } catch (error) {
      console.error('Failed to download file:', error);
      toast.showError('Failed to download file');
    }
  };

  if (loading) return <Loading text="Loading assignments..." />;

  return (
    <div className="assignments-page">
      <div className="assignments-header">
        <h1>📚 Assignment Management</h1>
        <p>Create and manage graded assignments with file uploads</p>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          + Create Assignment
        </button>
      </div>

      <div className="assignments-grid">
        {assignments.length === 0 ? (
          <div className="empty-state">
            <h3>No assignments yet</h3>
            <p>Create your first assignment to get started</p>
          </div>
        ) : (
          assignments.map(assignment => (
            <div key={assignment._id} className="assignment-card">
              <div className="assignment-header">
                <h3>{assignment.title}</h3>
                <span className={`badge ${assignment.status}`}>{assignment.status}</span>
              </div>
              
              <p className="assignment-description">{assignment.description}</p>
              
              <div className="assignment-details">
                <div className="detail-item">
                  <span className="label">Due Date:</span>
                  <span>{new Date(assignment.dueDate).toLocaleDateString()}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Max Marks:</span>
                  <span>{assignment.maxMarks}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Type:</span>
                  <span>{assignment.assignmentType}</span>
                </div>
                {assignment.referenceFiles?.length > 0 && (
                  <div className="detail-item">
                    <span className="label">Reference Files:</span>
                    <div className="reference-files">
                      {assignment.referenceFiles.map((file, index) => (
                        <button
                          key={index}
                          className="file-download-btn"
                          onClick={() => downloadReferenceFile(assignment._id, index, file.originalName)}
                        >
                          📎 {file.originalName}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="assignment-actions">
                <button className="btn btn-secondary" onClick={() => handleEdit(assignment)}>
                  Edit
                </button>
                <button className="btn btn-danger" onClick={() => handleDelete(assignment._id)}>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content assignment-form-modal">
            <div className="modal-header">
              <h2>{editingAssignment ? 'Edit Assignment' : 'Create New Assignment'}</h2>
              <button className="close-btn" onClick={handleCloseForm}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="assignment-form">
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder="Assignment title"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Brief description"
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Instructions</label>
                <textarea
                  name="instructions"
                  value={formData.instructions}
                  onChange={handleChange}
                  placeholder="Detailed instructions for students"
                  rows="4"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Due Date *</label>
                  <input
                    type="date"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Max Marks</label>
                  <input
                    type="number"
                    name="maxMarks"
                    value={formData.maxMarks}
                    onChange={handleChange}
                    min="0"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Assignment Type *</label>
                <select
                  name="assignmentType"
                  value={formData.assignmentType}
                  onChange={handleChange}
                  required
                >
                  <option value="individual">Individual Student</option>
                  <option value="department">Entire Department</option>
                  <option value="year">Specific Year</option>
                </select>
              </div>

              {formData.assignmentType === 'individual' && (
                <div className="form-group">
                  <label>Assign To *</label>
                  <select
                    name="assignedTo"
                    value={formData.assignedTo}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select student</option>
                    {students.map(student => (
                      <option key={student._id} value={student._id}>
                        {student.name} ({student.studentId})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {formData.assignmentType === 'department' && (
                <div className="form-group">
                  <label>Target Department *</label>
                  <select
                    name="targetDepartment"
                    value={formData.targetDepartment}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select department</option>
                    <option value="CSE">CSE</option>
                    <option value="ECE">ECE</option>
                    <option value="ME">ME</option>
                    <option value="CE">CE</option>
                    <option value="EEE">EEE</option>
                    <option value="ISE">ISE</option>
                  </select>
                </div>
              )}

              {formData.assignmentType === 'year' && (
                <div className="form-group">
                  <label>Target Year *</label>
                  <select
                    name="targetYear"
                    value={formData.targetYear}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select year</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>
              )}

              <div className="form-group">
                <label>Reference Files (Optional)</label>
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                />
                {formData.referenceFiles.length > 0 && (
                  <div className="selected-files">
                    {Array.from(formData.referenceFiles).map((file, index) => (
                      <span key={index} className="file-tag">{file.name}</span>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={handleCloseForm}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingAssignment ? 'Update' : 'Create'} Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentManagement;
