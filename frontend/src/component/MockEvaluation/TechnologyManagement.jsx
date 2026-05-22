// frontend/src/component/MockEvaluation/TechnologyManagement.jsx - FIXED
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  getAllTechnologies,
  createTechnology,
  updateTechnology,
  deleteTechnology,
  updateEvaluationCriteria,
} from '../../services/technologyService';
import PageLayout from './PageLayout';
import './MockEvaluation.css';

const TECHNOLOGY_CATEGORIES = ['Programming', 'Framework', 'Database', 'Cloud', 'DevOps', 'Data Science', 'Mobile', 'Other'];

const TechnologyManagement = () => {
  const [technologies, setTechnologies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showCriteriaModal, setShowCriteriaModal] = useState(false);
  const [editingTechnology, setEditingTechnology] = useState(null);
  const [selectedTechnology, setSelectedTechnology] = useState(null);

  const [formData, setFormData] = useState({
    name: '', description: '', category: 'Other', rounds: 1, isActive: true,
  });
  const [criteriaForm, setCriteriaForm] = useState({ evaluationCriteria: [] });
  
  // ✅ FIX: Initialize filters as null instead of empty strings
  const [filters, setFilters] = useState({ category: null, isActive: null });

  useEffect(() => { 
    console.log('📊 Technology filters changed:', filters);
    fetchTechnologies(); 
  }, [filters]);

  const fetchTechnologies = async () => {
    try {
      setLoading(true);
      console.log('📥 Fetching technologies with filters:', filters);
      
      // ✅ FIX: Build clean filter object with only non-null values
      const filterParams = {};
      if (filters.category && filters.category !== '') {
        filterParams.category = filters.category;
      }
      if (filters.isActive !== null && filters.isActive !== undefined) {
        filterParams.isActive = filters.isActive;
      }
      
      const response = await getAllTechnologies(filterParams);
      setTechnologies(response.data || []);
      console.log('✅ Technologies loaded:', response.data?.length);
    } catch (error) {
      console.error('❌ Error fetching technologies:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch technologies');
      setTechnologies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name === 'rounds' ? parseInt(value) : value),
    }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    
    // ✅ FIX: Properly convert filter values
    if (name === 'isActive') {
      // Convert select value to boolean or null
      if (value === '') {
        setFilters(prev => ({ ...prev, [name]: null }));
      } else if (value === 'true') {
        setFilters(prev => ({ ...prev, [name]: true }));
      } else if (value === 'false') {
        setFilters(prev => ({ ...prev, [name]: false }));
      }
    } else {
      // For other filters, set to null if empty, otherwise set value
      setFilters(prev => ({ ...prev, [name]: value === '' ? null : value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTechnology) {
        await updateTechnology(editingTechnology.technologyId, formData);
        toast.success('Technology updated successfully!');
      } else {
        await createTechnology(formData);
        toast.success('Technology created successfully!');
      }
      setShowModal(false);
      resetForm();
      fetchTechnologies();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save technology');
      console.error('Save technology error:', error);
    }
  };

  const handleEdit = (technology) => {
    setEditingTechnology(technology);
    setFormData({
      name: technology.name,
      description: technology.description || '',
      category: technology.category,
      rounds: technology.rounds,
      isActive: technology.isActive,
    });
    setShowModal(true);
  };

  const handleDelete = async (technologyId) => {
    if (!window.confirm('Are you sure you want to delete this technology?')) return;
    try {
      await deleteTechnology(technologyId);
      toast.success('Technology deleted successfully!');
      fetchTechnologies();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete technology');
      console.error('Delete technology error:', error);
    }
  };

  const openCriteriaModal = (technology) => {
    setSelectedTechnology(technology);
    const existingCriteria = technology.evaluationCriteria || [];
    const criteriaByRound = [];
    for (let round = 1; round <= technology.rounds; round++) {
      const roundCriteria = existingCriteria.filter(c => c.roundNumber === round);
      if (roundCriteria.length === 0) {
        criteriaByRound.push({ roundNumber: round, criteriaName: '', maxScore: 100, description: '' });
      } else {
        criteriaByRound.push(...roundCriteria);
      }
    }
    setCriteriaForm({ evaluationCriteria: criteriaByRound });
    setShowCriteriaModal(true);
  };

  const handleAddCriteria = (round) => {
    setCriteriaForm(prev => ({
      evaluationCriteria: [...prev.evaluationCriteria, { roundNumber: round, criteriaName: '', maxScore: 100, description: '' }],
    }));
  };

  const handleCriteriaChange = (index, field, value) => {
    setCriteriaForm(prev => {
      const updated = [...prev.evaluationCriteria];
      updated[index] = { ...updated[index], [field]: (field === 'roundNumber' || field === 'maxScore') ? parseInt(value) : value };
      return { evaluationCriteria: updated };
    });
  };

  const handleRemoveCriteria = (index) => {
    setCriteriaForm(prev => ({ evaluationCriteria: prev.evaluationCriteria.filter((_, i) => i !== index) }));
  };

  const handleSaveCriteria = async () => {
    try {
      await updateEvaluationCriteria(
        selectedTechnology.technologyId,
        criteriaForm.evaluationCriteria.filter(c => c.criteriaName.trim() !== ''),
      );
      toast.success('Evaluation criteria updated successfully!');
      setShowCriteriaModal(false);
      fetchTechnologies();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update criteria');
      console.error('Save criteria error:', error);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', category: 'Other', rounds: 1, isActive: true });
    setEditingTechnology(null);
  };

  const groupCriteriaByRound = (criteria) => {
    const grouped = {};
    criteria.forEach(c => {
      if (!grouped[c.roundNumber]) grouped[c.roundNumber] = [];
      grouped[c.roundNumber].push(c);
    });
    return grouped;
  };

  if (loading && technologies.length === 0) {
    return (
      <PageLayout title="💻 Technology Management">
        <div className="loading-container"><div className="spinner"></div><p>Loading technologies...</p></div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="💻 Technology Management">
      <div className="technology-management">
        <div className="page-header">
          <h1>💻 Technology Management</h1>
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
            + Create Technology
          </button>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="filter-group">
            <label>Category:</label>
            <select name="category" value={filters.category || ''} onChange={handleFilterChange}>
              <option value="">All Categories</option>
              {TECHNOLOGY_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label>Active:</label>
            <select 
              name="isActive" 
              value={filters.isActive === null ? '' : filters.isActive === true ? 'true' : 'false'} 
              onChange={handleFilterChange}
            >
              <option value="">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          <button className="btn btn-secondary" onClick={() => setFilters({ category: null, isActive: null })}>
            Clear Filters
          </button>
        </div>

        {/* Technologies Grid */}
        <div className="technologies-grid">
          {technologies.length === 0 ? (
            <div className="empty-state"><p>No technologies found. Create your first technology!</p></div>
          ) : (
            technologies.map(tech => (
              <div key={tech.technologyId} className="technology-card">
                <div className="tech-header">
                  <h3>{tech.name}</h3>
                  <span className={`badge ${tech.isActive ? 'badge-success' : 'badge-secondary'}`}>
                    {tech.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="tech-details">
                  <p><strong>Category:</strong> {tech.category}</p>
                  <p><strong>Rounds:</strong> {tech.rounds}</p>
                  <p><strong>Batches:</strong> {tech.batchCount || 0}</p>
                  {tech.description && <p><strong>Description:</strong> {tech.description}</p>}
                </div>
                {tech.evaluationCriteria && tech.evaluationCriteria.length > 0 && (
                  <div className="tech-criteria">
                    <h4>Evaluation Criteria:</h4>
                    {Object.entries(groupCriteriaByRound(tech.evaluationCriteria)).map(([round, criteria]) => (
                      <div key={round} className="round-criteria">
                        <strong>Round {round}:</strong>
                        <ul>{criteria.map((c, idx) => <li key={idx}>{c.criteriaName} (Max: {c.maxScore})</li>)}</ul>
                      </div>
                    ))}
                  </div>
                )}
                <div className="tech-actions">
                  <button className="btn btn-sm btn-info" onClick={() => openCriteriaModal(tech)}>Manage Criteria</button>
                  <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(tech)}>Edit</button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDelete(tech.technologyId)}
                    disabled={tech.batchCount > 0}
                    title={tech.batchCount > 0 ? 'Cannot delete technology with active batches' : ''}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingTechnology ? 'Edit Technology' : 'Create New Technology'}</h2>
                <button className="btn-close" onClick={() => setShowModal(false)}>✕</button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Technology Name *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} required placeholder="e.g., Java, Python, React" />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea name="description" value={formData.description} onChange={handleInputChange} rows="3" placeholder="Technology description..." />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Category *</label>
                    <select name="category" value={formData.category} onChange={handleInputChange} required>
                      {TECHNOLOGY_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Number of Rounds *</label>
                    <input type="number" name="rounds" value={formData.rounds} onChange={handleInputChange} min="1" max="5" required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="checkbox-label">
                    <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleInputChange} />
                    Active
                  </label>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{editingTechnology ? 'Update Technology' : 'Create Technology'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Evaluation Criteria Modal */}
        {showCriteriaModal && selectedTechnology && (
          <div className="modal-overlay" onClick={() => setShowCriteriaModal(false)}>
            <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Evaluation Criteria for {selectedTechnology.name}</h2>
                <button className="btn-close" onClick={() => setShowCriteriaModal(false)}>✕</button>
              </div>
              <div className="criteria-editor">
                {Array.from({ length: selectedTechnology.rounds }, (_, i) => i + 1).map(round => (
                  <div key={round} className="round-section">
                    <div className="round-header">
                      <h3>Round {round}</h3>
                      <button type="button" className="btn btn-sm btn-primary" onClick={() => handleAddCriteria(round)}>+ Add Criteria</button>
                    </div>
                    <div className="criteria-list">
                      {criteriaForm.evaluationCriteria
                        .map((criteria, index) => ({ criteria, index }))
                        .filter(({ criteria }) => criteria.roundNumber === round)
                        .map(({ criteria, index }) => (
                          <div key={index} className="criteria-item">
                            <div className="form-row">
                              <div className="form-group flex-2">
                                <label>Criteria Name</label>
                                <input type="text" value={criteria.criteriaName}
                                  onChange={e => handleCriteriaChange(index, 'criteriaName', e.target.value)}
                                  placeholder="e.g., Code Quality, Problem Solving" />
                              </div>
                              <div className="form-group flex-1">
                                <label>Max Score</label>
                                <input type="number" value={criteria.maxScore}
                                  onChange={e => handleCriteriaChange(index, 'maxScore', e.target.value)}
                                  min="1" max="100" />
                              </div>
                              <button type="button" className="btn-icon btn-danger-icon" onClick={() => handleRemoveCriteria(index)} title="Remove">✕</button>
                            </div>
                            <div className="form-group">
                              <label>Description (Optional)</label>
                              <input type="text" value={criteria.description || ''}
                                onChange={e => handleCriteriaChange(index, 'description', e.target.value)}
                                placeholder="Description of this criteria..." />
                            </div>
                          </div>
                        ))}
                      {criteriaForm.evaluationCriteria.filter(c => c.roundNumber === round).length === 0 && (
                        <p className="empty-message">No criteria defined for this round yet.</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="modal-actions" style={{ padding: '0 24px 24px' }}>
                <button className="btn btn-secondary" onClick={() => setShowCriteriaModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSaveCriteria}>Save Criteria</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default TechnologyManagement;