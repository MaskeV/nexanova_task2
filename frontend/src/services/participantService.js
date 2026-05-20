// frontend/src/services/studentService.js
import api from './api';

const STUDENT_BASE = '/participants';

// Get all students (participants)
export const getAllStudents = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.isActive !== undefined) params.append('isActive', filters.isActive);
    
    const url = params.toString() ? `${STUDENT_BASE}?${params}` : STUDENT_BASE;
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get student by ID
export const getStudentById = async (studentId) => {
  try {
    const response = await api.get(`${STUDENT_BASE}/${studentId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Create student (admin only)
export const createStudent = async (studentData) => {
  try {
    const response = await api.post(STUDENT_BASE, studentData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update student (admin only)
export const updateStudent = async (studentId, studentData) => {
  try {
    const response = await api.put(`${STUDENT_BASE}/${studentId}`, studentData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete student (admin only)
export const deleteStudent = async (studentId) => {
  try {
    const response = await api.delete(`${STUDENT_BASE}/${studentId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};