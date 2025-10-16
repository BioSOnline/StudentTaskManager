import api from './authService';

export const studentService = {
  getStudents: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await api.get(`/students?${params}`);
    return response.data;
  },

  getStudent: async (id) => {
    const response = await api.get(`/students/${id}`);
    return response.data;
  },

  createStudent: async (studentData) => {
    const response = await api.post('/students', studentData);
    return response.data;
  },

  updateStudent: async (id, studentData) => {
    const response = await api.put(`/students/${id}`, studentData);
    return response.data;
  },

  deleteStudent: async (id) => {
    const response = await api.delete(`/students/${id}`);
    return response.data;
  },
};