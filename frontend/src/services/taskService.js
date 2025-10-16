import api from './authService';

export const taskService = {
  getTasks: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await api.get(`/tasks?${params}`);
    return response.data;
  },

  getTask: async (id) => {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },

  createTask: async (taskData) => {
    // Check if taskData contains files (FormData) or regular JSON
    if (taskData.attachments && taskData.attachments.some(att => att.file)) {
      // Handle file uploads
      const formData = new FormData();
      
      // Add regular fields
      Object.keys(taskData).forEach(key => {
        if (key === 'attachments') {
          // Handle file attachments
          taskData.attachments.forEach(attachment => {
            if (attachment.file) {
              formData.append('attachments', attachment.file);
            }
          });
        } else if (Array.isArray(taskData[key])) {
          formData.append(key, JSON.stringify(taskData[key]));
        } else {
          formData.append(key, taskData[key]);
        }
      });

      const response = await api.post('/tasks', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } else {
      // Regular JSON request
      const response = await api.post('/tasks', taskData);
      return response.data;
    }
  },

  updateTask: async (id, taskData) => {
    const response = await api.put(`/tasks/${id}`, taskData);
    return response.data;
  },

  deleteTask: async (id) => {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  },
};