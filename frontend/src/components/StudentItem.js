import React from 'react';
import '../styles/StudentItem.css';

const StudentItem = ({ student, onEdit, onDelete, onViewTasks }) => {
  const getYearColor = (year) => {
    const colors = {
      '1st Year': '#e3f2fd',
      '2nd Year': '#f3e5f5',
      '3rd Year': '#e8f5e8',
      '4th Year': '#fff3cd',
      'Graduate': '#ffebee'
    };
    return colors[year] || '#f8f9fa';
  };

  return (
    <div className="student-item">
      <div className="student-header">
        <div className="student-avatar">
          {student.name.charAt(0).toUpperCase()}
        </div>
        <div className="student-actions">
          <button
            className="action-btn view-tasks-btn"
            onClick={() => onViewTasks(student)}
            title="View student's tasks"
          >
            📋
          </button>
          <button
            className="action-btn edit-btn"
            onClick={() => onEdit(student)}
            title="Edit student"
          >
            ✏️
          </button>
          <button
            className="action-btn delete-btn"
            onClick={() => onDelete(student._id)}
            title="Delete student"
          >
            🗑️
          </button>
        </div>
      </div>

      <div className="student-body">
        <h3 className="student-name">{student.name}</h3>
        <p className="student-id">ID: {student.studentId}</p>
        {student.email && (
          <p className="student-email">📧 {student.email}</p>
        )}
      </div>

      <div className="student-footer">
        <div className="student-details">
          {student.course && (
            <span className="student-course">
              📚 {student.course}
            </span>
          )}
          <span 
            className="student-year" 
            style={{ backgroundColor: getYearColor(student.year) }}
          >
            {student.year}
          </span>
          {student.department && (
            <span className="student-department">
              🏫 {student.department}
            </span>
          )}
        </div>
        
        {student.phoneNumber && (
          <div className="student-phone">
            📞 {student.phoneNumber}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentItem;