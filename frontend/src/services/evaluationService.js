// frontend/src/services/evaluationService.js
import api from './api';

const EVALUATION_BASE = '/evaluations';

// Assign evaluation (admin only)
export const assignEvaluation = async (evaluationData) => {
  try {
    const response = await api.post(`${EVALUATION_BASE}/assign`, evaluationData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get evaluations assigned to current user (evaluator)
export const getMyEvaluations = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    
    const url = params.toString() ? `${EVALUATION_BASE}/my-evaluations?${params}` : `${EVALUATION_BASE}/my-evaluations`;
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Submit evaluation scores and feedback (evaluator)
export const submitEvaluation = async (evaluationId, evaluationData) => {
  try {
    const response = await api.put(`${EVALUATION_BASE}/${evaluationId}/submit`, evaluationData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get evaluation by ID
export const getEvaluationById = async (evaluationId) => {
  try {
    const response = await api.get(`${EVALUATION_BASE}/${evaluationId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get all evaluations (admin only)
export const getAllEvaluations = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.batch) params.append('batch', filters.batch);
    if (filters.technology) params.append('technology', filters.technology);
    if (filters.status) params.append('status', filters.status);
    if (filters.round) params.append('round', filters.round);
    
    const url = params.toString() ? `${EVALUATION_BASE}?${params}` : EVALUATION_BASE;
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get evaluations for a specific batch (admin)
export const getBatchEvaluations = async (batchId, filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.round) params.append('round', filters.round);
    if (filters.status) params.append('status', filters.status);
    
    const url = params.toString() 
      ? `${EVALUATION_BASE}/batch/${batchId}?${params}` 
      : `${EVALUATION_BASE}/batch/${batchId}`;
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get participant's evaluations
export const getParticipantEvaluations = async (participantId) => {
  try {
    const response = await api.get(`${EVALUATION_BASE}/participant/${participantId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete evaluation assignment (admin only)
export const deleteEvaluation = async (evaluationId) => {
  try {
    const response = await api.delete(`${EVALUATION_BASE}/${evaluationId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};