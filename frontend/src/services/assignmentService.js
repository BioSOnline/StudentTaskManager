import axios from 'axios';

const API_URL = 'http://localhost:5000/api/assignments';

// Set up axios interceptor to include auth token
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const assignmentService = {
  // Upload assignment
  uploadAssignment: async (formData, onUploadProgress) => {
    try {
      const response = await axios.post(`${API_URL}/submit`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: onUploadProgress || ((progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          console.log(`Upload Progress: ${percentCompleted}%`);
        }),
      });
      return response.data;
    } catch (error) {
      console.error('Upload error:', error);
      throw error.response?.data || error.message;
    }
  },

  // Get submissions for a specific task
  getSubmissions: async (taskId) => {
    try {
      const response = await axios.get(`${API_URL}/task/${taskId}`);
      return response.data;
    } catch (error) {
      console.error('Get submissions error:', error);
      throw error.response?.data || error.message;
    }
  },

  // Get all submissions (for teachers)
  getAllSubmissions: async () => {
    try {
      const response = await axios.get(`${API_URL}/all`);
      return response.data;
    } catch (error) {
      console.error('Get all submissions error:', error);
      throw error.response?.data || error.message;
    }
  },

  // Download submission file
  downloadSubmission: async (fileId, filename) => {
    try {
      const response = await axios.get(`${API_URL}/download/${fileId}`, {
        responseType: 'blob',
      });
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return response.data;
    } catch (error) {
      console.error('Download error:', error);
      throw error.response?.data || error.message;
    }
  },

  // Update grade and feedback
  updateGrade: async (submissionId, gradeData) => {
    try {
      const response = await axios.put(`${API_URL}/grade/${submissionId}`, gradeData);
      return response.data;
    } catch (error) {
      console.error('Update grade error:', error);
      throw error.response?.data || error.message;
    }
  },

  // Delete submission
  deleteSubmission: async (submissionId) => {
    try {
      const response = await axios.delete(`${API_URL}/${submissionId}`);
      return response.data;
    } catch (error) {
      console.error('Delete submission error:', error);
      throw error.response?.data || error.message;
    }
  },

  // Get student's submissions
  getMySubmissions: async () => {
    try {
      const response = await axios.get(`${API_URL}/my-submissions`);
      return response.data;
    } catch (error) {
      console.error('Get my submissions error:', error);
      throw error.response?.data || error.message;
    }
  },
};