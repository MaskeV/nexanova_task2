// frontend/src/services/reportService.js
import api from './api';

const REPORT_BASE = '/reports';

// Generate batch evaluation report (admin only)
export const generateBatchReport = async (batchId) => {
  try {
    const response = await api.get(`${REPORT_BASE}/batch/${batchId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Generate technology-wise report (admin only)
export const generateTechnologyReport = async (technologyId) => {
  try {
    const response = await api.get(`${REPORT_BASE}/technology/${technologyId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Generate participant performance report (admin or own participant)
export const generateParticipantReport = async (participantId) => {
  try {
    const response = await api.get(`${REPORT_BASE}/participant/${participantId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Generate evaluator workload report (admin only)
export const generateEvaluatorReport = async (evaluatorId) => {
  try {
    const response = await api.get(`${REPORT_BASE}/evaluator/${evaluatorId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get overall system statistics (admin only)
export const getSystemStats = async () => {
  try {
    const response = await api.get(`${REPORT_BASE}/stats`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Export report to CSV (frontend utility function)
export const exportToCSV = (data, filename) => {
  const csv = convertToCSV(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Helper function to convert JSON to CSV
const convertToCSV = (data) => {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',');
  
  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header];
      // Handle values with commas or quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',');
  });
  
  return [csvHeaders, ...csvRows].join('\n');
};