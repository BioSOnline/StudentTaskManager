import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentService } from '../services/studentService';
import StudentForm from '../components/StudentForm';
import StudentItem from '../components/StudentItem';
import '../styles/Students.css';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const studentsData = await studentService.getStudents();
      setStudents(studentsData);
    } catch (error) {
      console.error('Failed to fetch students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStudent = async (studentData) => {
    try {
      const newStudent = await studentService.createStudent(studentData);
      setStudents(prev => [newStudent, ...prev]);
      setShowForm(false);
    } catch (error) {
      console.error('Failed to create student:', error);
      alert(error.response?.data?.message || 'Failed to create student');
    }
  };

  const handleUpdateStudent = async (studentData) => {
    try {
      const updatedStudent = await studentService.updateStudent(editingStudent._id, studentData);
      setStudents(prev => prev.map(student => 
        student._id === editingStudent._id ? updatedStudent : student
      ));
      setEditingStudent(null);
      setShowForm(false);
    } catch (error) {
      console.error('Failed to update student:', error);
      alert(error.response?.data?.message || 'Failed to update student');
    }
  };

  const handleDeleteStudent = async (studentId) => {
    if (window.confirm('Are you sure you want to delete this student? This will also delete all their tasks.')) {
      try {
        await studentService.deleteStudent(studentId);
        setStudents(prev => prev.filter(student => student._id !== studentId));
      } catch (error) {
        console.error('Failed to delete student:', error);
        alert('Failed to delete student');
      }
    }
  };

  const handleEditStudent = (student) => {
    setEditingStudent(student);
    setShowForm(true);
  };

  const handleViewTasks = (student) => {
    // Navigate to tasks page with student filter
    navigate(`/tasks?studentId=${student._id}&studentName=${encodeURIComponent(student.name)}`);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingStudent(null);
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesYear = yearFilter === '' || student.year === yearFilter;
    return matchesSearch && matchesYear;
  });

  if (loading) {
    return <div className="loading">Loading students...</div>;
  }

  return (
    <div className="students-page">
      <div className="students-header">
        <h1>Manage Students</h1>
        <button 
          className="btn btn-primary" 
          onClick={() => setShowForm(true)}
        >
          + Add New Student
        </button>
      </div>

      <div className="students-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search students by name, ID, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
        >
          <option value="">All Years</option>
          <option value="1st Year">1st Year</option>
          <option value="2nd Year">2nd Year</option>
          <option value="3rd Year">3rd Year</option>
          <option value="4th Year">4th Year</option>
          <option value="Graduate">Graduate</option>
        </select>
      </div>

      <div className="students-content">
        {filteredStudents.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h3>No students found</h3>
            <p>
              {students.length === 0 
                ? "Start by adding your first student to assign tasks and track their progress." 
                : "No students match your current search criteria."
              }
            </p>
            {students.length === 0 && (
              <button 
                className="btn btn-primary" 
                onClick={() => setShowForm(true)}
              >
                Add Your First Student
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="students-stats">
              <span>Showing {filteredStudents.length} of {students.length} students</span>
            </div>
            <div className="students-grid">
              {filteredStudents.map(student => (
                <StudentItem
                  key={student._id}
                  student={student}
                  onEdit={handleEditStudent}
                  onDelete={handleDeleteStudent}
                  onViewTasks={handleViewTasks}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {showForm && (
        <StudentForm
          student={editingStudent}
          onSubmit={editingStudent ? handleUpdateStudent : handleCreateStudent}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
};

export default Students;