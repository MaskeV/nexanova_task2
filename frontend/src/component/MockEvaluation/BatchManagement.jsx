// frontend/src/components/MockEvaluation/BatchManagement.jsx - FIXED
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  getAllBatches,
  createBatch,
  updateBatch,
  deleteBatch,
  addParticipantsToBatch,
  removeParticipantFromBatch
} from '../../services/batchService';
import { getAllTechnologies } from '../../services/technologyService';
import { getAllStudents } from '../../services/studentService';
import './MockEvaluation.css';

const BatchManagement = () => {
  const [batches, setBatches] = useState([]);
  const [technologies, setTechnologies] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showParticipantModal, setShowParticipantModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    technology: '',
    status: 'scheduled',
    isActive: true
  });

  const [filters, setFilters] = useState({
    status: null,
    technology: null,
    isActive: null
  });

  // ✅ FIX: Separate useEffect for initial load vs filter changes
  useEffect(() => {
    fetchInitialData();
  }, []); // Empty array = run once on mount

  useEffect(() => {
    fetchBatches();
  }, [filters]); // Run when filters change

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [techRes, studentsRes] = await Promise.all([
        getAllTechnologies({ isActive: true }),
        getAllStudents()
      ]);
      
      setTechnologies(techRes.data || []);
      setStudents(studentsRes.data || []);
      
      // Fetch batches with empty filters (get all batches)
      await fetchBatches();
    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async () => {
    try {
      setLoading(true);
      // ✅ FIX: Pass filters object - service will handle empty values
      const batchesRes = await getAllBatches(filters);
      setBatches(batchesRes.data || []);
    } catch (error) {
      console.error('Error fetching batches:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch batches');
      setBatches([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    // ✅ FIX: Convert empty string to null for proper filtering
    setFilters(prev => ({
      ...prev,
      [name]: value === '' ? null : value
    }));
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
      console.error('Error saving batch:', error);
      toast.error(error.response?.data?.message || 'Failed to save batch');
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
      isActive: batch.isActive
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
      console.error('Error deleting batch:', error);
      toast.error(error.response?.data?.message || 'Failed to delete batch');
    }
  };

  const handleAddParticipants = async () => {
    if (selectedParticipants.length === 0) {
      toast.warning('Please select at least one participant');
      return;
    }

    try {
      await addParticipantsToBatch(selectedBatch.batchId, selectedParticipants);
      toast.success('Participants added successfully!');
      setShowParticipantModal(false);
      setSelectedParticipants([]);
      fetchBatches();
    } catch (error) {
      console.error('Error adding participants:', error);
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
      console.error('Error removing participant:', error);
      toast.error(error.response?.data?.message || 'Failed to remove participant');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      technology: '',
      status: 'scheduled',
      isActive: true
    });
    setEditingBatch(null);
  };

  const openParticipantModal = (batch) => {
    setSelectedBatch(batch);
    setShowParticipantModal(true);
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      scheduled: 'badge-info',
      ongoing: 'badge-success',
      completed: 'badge-secondary',
      cancelled: 'badge-danger'
    };
    return statusColors[status] || 'badge-secondary';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading batches...</p>
      </div>
    );
  }

  return (
    <div className="batch-management">
      <div className="page-header">
        <h1>📦 Batch Management</h1>
        <button 
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
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
              <option key={tech.technologyId} value={tech.technologyId}>
                {tech.name}
              </option>
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

        <button 
          className="btn btn-secondary"
          onClick={() => setFilters({ status: null, technology: null, isActive: null })}
        >
          Clear Filters
        </button>
      </div>

      {/* Batches List */}
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
                <span className={`badge ${getStatusBadge(batch.status)}`}>
                  {batch.status}
                </span>
              </div>

              <div className="batch-details">
                <p><strong>Batch ID:</strong> {batch.batchId}</p>
                <p><strong>Technology:</strong> {batch.technologyDetails?.name || batch.technology}</p>
                <p><strong>Start Date:</strong> {new Date(batch.startDate).toLocaleDateString()}</p>
                <p><strong>End Date:</strong> {new Date(batch.endDate).toLocaleDateString()}</p>
                <p><strong>Participants:</strong> {batch.participants?.length || 0}</p>
                {batch.description && <p><strong>Description:</strong> {batch.description}</p>}
              </div>

              <div className="batch-actions">
                <button 
                  className="btn btn-sm btn-primary"
                  onClick={() => openParticipantModal(batch)}
                >
                  Manage Participants
                </button>
                <button 
                  className="btn btn-sm btn-secondary"
                  onClick={() => handleEdit(batch)}
                >
                  Edit
                </button>
                <button 
                  className="btn btn-sm btn-danger"
                  onClick={() => handleDelete(batch.batchId)}
                >
                  Delete
                </button>
              </div>

              {batch.participants && batch.participants.length > 0 && (
                <div className="participants-list">
                  <h4>Participants:</h4>
                  <ul>
                    {batch.participants.map(participant => (
                      <li key={participant._id}>
                        {participant.username} ({participant.email})
                        <button
                          className="btn-icon btn-danger-icon"
                          onClick={() => handleRemoveParticipant(batch.batchId, participant._id)}
                          title="Remove participant"
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

      {/* Create/Edit Batch Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
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
                <select
                  name="technology"
                  value={formData.technology}
                  onChange={handleInputChange}
                  required
                >
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
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              )}

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                  />
                  Active
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingBatch ? 'Update Batch' : 'Create Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Participants Modal */}
      {showParticipantModal && selectedBatch && (
        <div className="modal-overlay" onClick={() => setShowParticipantModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Participants to {selectedBatch.name}</h2>
              <button className="btn-close" onClick={() => setShowParticipantModal(false)}>✕</button>
            </div>

            <div className="participants-selection">
              <p>Select students to add to this batch:</p>
              
              <div className="students-list">
                {students
                  .filter(student => !selectedBatch.participants?.some(p => p._id === student._id))
                  .map(student => (
                    <label key={student._id} className="student-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedParticipants.includes(student._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedParticipants(prev => [...prev, student._id]);
                          } else {
                            setSelectedParticipants(prev => prev.filter(id => id !== student._id));
                          }
                        }}
                      />
                      {student.username} ({student.email})
                    </label>
                  ))}
              </div>

              {selectedParticipants.length > 0 && (
                <p className="selection-count">
                  {selectedParticipants.length} student{selectedParticipants.length > 1 ? 's' : ''} selected
                </p>
              )}
            </div>

            <div className="modal-actions">
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
  );
};

export default BatchManagement;