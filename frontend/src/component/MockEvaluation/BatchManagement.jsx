// frontend/src/component/MockEvaluation/BatchManagement.jsx
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  getAllBatches,
  createBatch,
  updateBatch,
  deleteBatch,
  addParticipantsToBatch,
  removeParticipantFromBatch,
} from '../../services/batchService';
import { getAllTechnologies } from '../../services/technologyService';
import { getAllParticipants } from '../../services/participantService'; // Import participant service
import PageLayout from './PageLayout';
import './MockEvaluation.css';

const BatchManagement = () => {
  const [batches, setBatches] = useState([]);
  const [technologies, setTechnologies] = useState([]);
  const [participants, setParticipants] = useState([]); // Changed from students to participants
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showParticipantModal, setShowParticipantModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [selectedParticipants, setSelectedParticipants] = useState([]);

  const [formData, setFormData] = useState({
    name: '', description: '', startDate: '', endDate: '',
    technology: '', status: 'scheduled', isActive: true,
  });

  const [filters, setFilters] = useState({ status: null, technology: null, isActive: null });

  useEffect(() => { fetchInitialData(); }, []);
  useEffect(() => { fetchBatches(); }, [filters]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [techRes, participantsRes] = await Promise.all([
        getAllTechnologies({ isActive: true }),
        getAllParticipants(), // Fetch from Participant model
      ]);
      setTechnologies(techRes.data || []);
      setParticipants(participantsRes.data || []);
      console.log('Participants loaded:', participantsRes.data); // Debug log
      await fetchBatches();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch data');
      console.error('Initial data fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const batchesRes = await getAllBatches(filters);
      setBatches(batchesRes.data || []);
      console.log('Batches loaded:', batchesRes.data); // Debug log
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch batches');
      setBatches([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value === '' ? null : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBatch) {
        await updateBatch(editingBatch.batchId, formData);
        toast.success('Batch updated successfully!');
      } else {
        await createBatch(formData);
        toast.success('Batch created successfully!');
      }
      setShowModal(false);
      resetForm();
      fetchBatches();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save batch');
      console.error('Save batch error:', error);
    }
  };

  const handleEdit = (batch) => {
    setEditingBatch(batch);
    setFormData({
      name: batch.name,
      description: batch.description || '',
      startDate: batch.startDate?.split('T')[0] || '',
      endDate: batch.endDate?.split('T')[0] || '',
      technology: batch.technology,
      status: batch.status,
      isActive: batch.isActive,
    });
    setShowModal(true);
  };

  const handleDelete = async (batchId) => {
    if (!window.confirm('Are you sure you want to delete this batch?')) return;
    try {
      await deleteBatch(batchId);
      toast.success('Batch deleted successfully!');
      fetchBatches();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete batch');
      console.error('Delete batch error:', error);
    }
  };

  const handleAddParticipants = async () => {
    if (selectedParticipants.length === 0) {
      toast.warning('Please select at least one participant');
      return;
    }

    try {
      console.log('Adding participants to batch:', {
        batchId: selectedBatch.batchId,
        participantIds: selectedParticipants
      });

      await addParticipantsToBatch(selectedBatch.batchId, selectedParticipants);
      toast.success('Participants added successfully!');
      setShowParticipantModal(false);
      setSelectedParticipants([]);
      fetchBatches(); // Refresh batches to show updated participants
    } catch (error) {
      console.error('Add participants error:', error);
      toast.error(error.response?.data?.message || 'Failed to add participants');
    }
  };

  const handleRemoveParticipant = async (batchId, participantId) => {
    if (!window.confirm('Remove this participant from the batch?')) return;
    try {
      await removeParticipantFromBatch(batchId, participantId);
      toast.success('Participant removed successfully!');
      fetchBatches();
    } catch (error) {
      console.error('Remove participant error:', error);
      toast.error(error.response?.data?.message || 'Failed to remove participant');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', startDate: '', endDate: '', technology: '', status: 'scheduled', isActive: true });
    setEditingBatch(null);
  };

  const openParticipantModal = (batch) => { 
    setSelectedBatch(batch); 
    setSelectedParticipants([]); // Reset selected participants
    setShowParticipantModal(true); 
  };

  const getStatusBadge = (status) => ({
    scheduled: 'badge-info', 
    ongoing: 'badge-success',
    completed: 'badge-secondary', 
    cancelled: 'badge-danger',
  }[status] || 'badge-secondary');

  if (loading && batches.length === 0) {
    return (
      <PageLayout title="📦 Batch Management">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading batches...</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="📦 Batch Management">
      <div className="batch-management">
        {/* Header */}
        <div className="page-header">
          <h1>📦 Batch Management</h1>
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
            + Create Batch
          </button>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="filter-group">
            <label>Status:</label>
            <select name="status" value={filters.status || ''} onChange={handleFilterChange}>
              <option value="">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Technology:</label>
            <select name="technology" value={filters.technology || ''} onChange={handleFilterChange}>
              <option value="">All Technologies</option>
              {technologies.map(tech => (
                <option key={tech.technologyId} value={tech.technologyId}>{tech.name}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Active:</label>
            <select name="isActive" value={filters.isActive || ''} onChange={handleFilterChange}>
              <option value="">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          <button className="btn btn-secondary" onClick={() => setFilters({ status: null, technology: null, isActive: null })}>
            Clear Filters
          </button>
        </div>

        {/* Batch Cards */}
        <div className="batches-grid">
          {batches.length === 0 ? (
            <div className="empty-state">
              <p>No batches found. Create your first batch!</p>
            </div>
          ) : (
            batches.map(batch => (
              <div key={batch.batchId} className="batch-card">
                <div className="batch-header">
                  <h3>{batch.name}</h3>
                  <span className={`badge ${getStatusBadge(batch.status)}`}>{batch.status}</span>
                </div>
                <div className="batch-details">
                  <p><strong>Technology:</strong> {batch.technologyDetails?.name || batch.technology}</p>
                  <p><strong>Start:</strong> {new Date(batch.startDate).toLocaleDateString()}</p>
                  <p><strong>End:</strong> {new Date(batch.endDate).toLocaleDateString()}</p>
                  <p><strong>Participants:</strong> {batch.participants?.length || 0}</p>
                  {batch.description && <p><strong>Description:</strong> {batch.description}</p>}
                </div>
                <div className="batch-actions">
                  <button className="btn btn-sm btn-primary" onClick={() => openParticipantModal(batch)}>
                    Manage Participants
                  </button>
                  <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(batch)}>Edit</button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(batch.batchId)}>Delete</button>
                </div>
                {batch.participants && batch.participants.length > 0 && (
                  <div className="participants-list">
                    <h4>Participants:</h4>
                    <ul>
                      {batch.participants.map(p => (
                        <li key={p._id}>
                          {p.name} ({p.email})
                          <button 
                            className="btn-icon btn-danger-icon" 
                            onClick={() => handleRemoveParticipant(batch.batchId, p._id)} 
                            title="Remove"
                          >
                            ✕
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingBatch ? 'Edit Batch' : 'Create New Batch'}</h2>
                <button className="btn-close" onClick={() => setShowModal(false)}>✕</button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Batch Name *</label>
                  <input 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleInputChange} 
                    required 
                    placeholder="e.g., Java Batch Spring 2024" 
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea 
                    name="description" 
                    value={formData.description} 
                    onChange={handleInputChange} 
                    rows="3" 
                    placeholder="Batch description..." 
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Start Date *</label>
                    <input 
                      type="date" 
                      name="startDate" 
                      value={formData.startDate} 
                      onChange={handleInputChange} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>End Date *</label>
                    <input 
                      type="date" 
                      name="endDate" 
                      value={formData.endDate} 
                      onChange={handleInputChange} 
                      required 
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Technology *</label>
                  <select name="technology" value={formData.technology} onChange={handleInputChange} required>
                    <option value="">Select Technology</option>
                    {technologies.map(tech => (
                      <option key={tech.technologyId} value={tech.technologyId}>
                        {tech.name} ({tech.rounds} round{tech.rounds > 1 ? 's' : ''})
                      </option>
                    ))}
                  </select>
                </div>
                {editingBatch && (
                  <div className="form-group">
                    <label>Status</label>
                    <select name="status" value={formData.status} onChange={handleInputChange}>
                      <option value="scheduled">Scheduled</option>
                      <option value="ongoing">Ongoing</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                )}
                <div className="form-group">
                  <label className="checkbox-label">
                    <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleInputChange} />
                    Active
                  </label>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{editingBatch ? 'Update Batch' : 'Create Batch'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Participants Modal */}
        {showParticipantModal && selectedBatch && (
          <div className="modal-overlay" onClick={() => setShowParticipantModal(false)}>
            <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Add Participants to {selectedBatch.name}</h2>
                <button className="btn-close" onClick={() => setShowParticipantModal(false)}>✕</button>
              </div>
              <div className="participants-selection" style={{ padding: '0 24px 24px' }}>
                <p style={{ marginBottom: 12, color: '#64748b', fontSize: '0.875rem' }}>
                  Select participants to add to this batch:
                </p>
                <div className="students-list">
                  {participants.length === 0 ? (
                    <p className="hint-text">No participants available. Please register participants first.</p>
                  ) : (
                    participants
                      .filter(participant => !selectedBatch.participants?.some(existingP => existingP._id === participant._id))
                      .map(participant => (
                        <label key={participant._id} className="student-checkbox">
                          <input
                            type="checkbox"
                            checked={selectedParticipants.includes(participant._id)}
                            onChange={e => {
                              if (e.target.checked) {
                                setSelectedParticipants(prev => [...prev, participant._id]);
                              } else {
                                setSelectedParticipants(prev => prev.filter(id => id !== participant._id));
                              }
                            }}
                          />
                          {participant.name} ({participant.email})
                        </label>
                      ))
                  )}
                </div>
                {selectedParticipants.length > 0 && (
                  <p className="selection-count" style={{ marginTop: 12 }}>
                    {selectedParticipants.length} participant{selectedParticipants.length > 1 ? 's' : ''} selected
                  </p>
                )}
              </div>
              <div className="modal-actions" style={{ padding: '0 24px 24px' }}>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => { 
                    setShowParticipantModal(false); 
                    setSelectedParticipants([]); 
                  }}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={handleAddParticipants} 
                  disabled={selectedParticipants.length === 0}
                >
                  Add {selectedParticipants.length} Participant{selectedParticipants.length !== 1 ? 's' : ''}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default BatchManagement;