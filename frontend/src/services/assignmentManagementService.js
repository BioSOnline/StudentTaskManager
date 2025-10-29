import api from './authService';

export const assignmentManagementService = {
  // Get all assignments created by teacher
  getAssignments: async () => {
    const response = await api.get('/assignment-management');
    return response.data;
  },

  // Get assignments for a specific student
  getStudentAssignments: async (studentId) => {
    const response = await api.get(`/assignment-management/student/${studentId}`);
    return response.data;
  },

  // Create new assignment
  createAssignment: async (assignmentData) => {
    const formData = new FormData();
    
    // Append text fields
    Object.keys(assignmentData).forEach(key => {
      if (key !== 'referenceFiles') {
        if (Array.isArray(assignmentData[key])) {
          assignmentData[key].forEach(item => {
            formData.append(key, item);
          });
        } else {
          formData.append(key, assignmentData[key]);
        }
      }
    });

    // Append files
    if (assignmentData.referenceFiles && assignmentData.referenceFiles.length > 0) {
      assignmentData.referenceFiles.forEach(file => {
        formData.append('referenceFiles', file);
      });
    }

    const response = await api.post('/assignment-management', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Update assignment
  updateAssignment: async (id, assignmentData) => {
    const response = await api.put(`/assignment-management/${id}`, assignmentData);
    return response.data;
  },

  // Delete assignment
  deleteAssignment: async (id) => {
    const response = await api.delete(`/assignment-management/${id}`);
    return response.data;
  },

  // Download reference file
  downloadReferenceFile: async (assignmentId, fileIndex, filename) => {
    const response = await api.get(`/assignment-management/download/${assignmentId}/${fileIndex}`, {
      responseType: 'blob'
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
};
