
/// frontend/src/services/technologyService.js
import api from './api';

const TECHNOLOGY_BASE = '/technologies';

// Get all technologies
export const getAllTechnologies = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.isActive !== undefined) params.append('isActive', filters.isActive);
    
    const url = params.toString() ? `${TECHNOLOGY_BASE}?${params}` : TECHNOLOGY_BASE;
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get technology by ID
export const getTechnologyById = async (technologyId) => {
  try {
    const response = await api.get(`${TECHNOLOGY_BASE}/${technologyId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Create technology (admin only)
export const createTechnology = async (technologyData) => {
  try {
    const response = await api.post(TECHNOLOGY_BASE, technologyData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update technology (admin only)
export const updateTechnology = async (technologyId, technologyData) => {
  try {
    const response = await api.put(`${TECHNOLOGY_BASE}/${technologyId}`, technologyData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete technology (admin only)
export const deleteTechnology = async (technologyId) => {
  try {
    const response = await api.delete(`${TECHNOLOGY_BASE}/${technologyId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update evaluation criteria for a technology
export const updateEvaluationCriteria = async (technologyId, evaluationCriteria) => {
  try {
    const response = await api.put(`${TECHNOLOGY_BASE}/${technologyId}/criteria`, {
      evaluationCriteria
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};