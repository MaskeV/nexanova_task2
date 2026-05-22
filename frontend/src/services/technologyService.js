// frontend/src/services/technologyService.js - FIXED
import api from './api';

const TECHNOLOGY_BASE = '/technologies';

// Get all technologies - FIXED filter handling
export const getAllTechnologies = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    // Only add category filter if provided and not empty
    if (filters.category && filters.category !== '') {
      params.append('category', filters.category);
    }
    
    // Only add isActive filter if explicitly set (true or false, not null/undefined)
    if (filters.isActive === true) {
      params.append('isActive', 'true');
    } else if (filters.isActive === false) {
      params.append('isActive', 'false');
    }
    
    const url = params.toString() 
      ? `${TECHNOLOGY_BASE}?${params}` 
      : TECHNOLOGY_BASE;
    
    console.log('📥 Fetching technologies from:', url);
    const response = await api.get(url);
    console.log('✅ Technologies loaded:', response.data?.count || 0);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching technologies:', error.response?.data || error.message);
    throw error;
  }
};

// Get technology by ID
export const getTechnologyById = async (technologyId) => {
  try {
    console.log('📥 Fetching technology:', technologyId);
    const response = await api.get(`${TECHNOLOGY_BASE}/${technologyId}`);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching technology:', error);
    throw error;
  }
};

// Create technology (admin only)
export const createTechnology = async (technologyData) => {
  try {
    console.log('📤 Creating technology:', technologyData.name);
    const response = await api.post(TECHNOLOGY_BASE, technologyData);
    console.log('✅ Technology created:', response.data?.data?.technologyId);
    return response.data;
  } catch (error) {
    console.error('❌ Error creating technology:', error);
    throw error;
  }
};

// Update technology (admin only)
export const updateTechnology = async (technologyId, technologyData) => {
  try {
    console.log('📝 Updating technology:', technologyId);
    const response = await api.put(`${TECHNOLOGY_BASE}/${technologyId}`, technologyData);
    console.log('✅ Technology updated:', technologyId);
    return response.data;
  } catch (error) {
    console.error('❌ Error updating technology:', error);
    throw error;
  }
};

// Delete technology (admin only)
export const deleteTechnology = async (technologyId) => {
  try {
    console.log('🗑️ Deleting technology:', technologyId);
    const response = await api.delete(`${TECHNOLOGY_BASE}/${technologyId}`);
    console.log('✅ Technology deleted:', technologyId);
    return response.data;
  } catch (error) {
    console.error('❌ Error deleting technology:', error);
    throw error;
  }
};

// Update evaluation criteria for a technology
export const updateEvaluationCriteria = async (technologyId, evaluationCriteria) => {
  try {
    console.log('📊 Updating criteria for:', technologyId);
    const response = await api.put(`${TECHNOLOGY_BASE}/${technologyId}/criteria`, {
      evaluationCriteria
    });
    console.log('✅ Criteria updated for:', technologyId);
    return response.data;
  } catch (error) {
    console.error('❌ Error updating criteria:', error);
    throw error;
  }
};