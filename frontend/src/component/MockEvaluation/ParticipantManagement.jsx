// frontend/src/component/MockEvaluation/ParticipantManagement.jsx
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  getAllParticipants,
  createParticipant,
  updateParticipant,
  deleteParticipant,
} from '../../services/participantService';
import PageLayout from './PageLayout';
import './MockEvaluation.css';

const ParticipantManagement = () => {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    isActive: true,
  });

  const [filters, setFilters] = useState({ isActive: null, search: '' });

  useEffect(() => {
    fetchParticipants();
  }, [filters.isActive]);

  const fetchParticipants = async () => {
    try {
      setLoading(true);
      const filterParams = {};
      if (filters.isActive !== null) {
        filterParams.isActive = filters.isActive;
      }
      
      const response = await getAllParticipants(filterParams);
      setParticipants(response.data || []);
      console.log('✅ Participants loaded:', response.data?.length);
    } catch (error) {
      console.error('❌ Error fetching participants:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch participants');
      setParticipants([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'isActive') {
      if (value === '') {
        setFilters(prev => ({ ...prev, [name]: null }));
      } else if (value === 'true') {
        setFilters(prev => ({ ...prev, [name]: true }));
      } else if (value === 'false') {
        setFilters(prev => ({ ...prev, [name]: false }));
      }
    } else {
      setFilters(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingParticipant) {
        await updateParticipant(editingParticipant.participantId, formData);
        toast.success('Participant updated successfully!');
      } else {
        await createParticipant(formData);
        toast.success('Participant created successfully!');
      }
      setShowModal(false);
      resetForm();
      fetchParticipants();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save participant');
      console.error('Save participant error:', error);
    }
  };

  const handleEdit = (participant) => {
    setEditingParticipant(participant);
    setFormData({
      name: participant.name,
      email: participant.email,
      phone: participant.phone || '',
      isActive: participant.isActive,
    });
    setShowModal(true);
  };

  const handleDelete = async (participantId) => {
    if (!window.confirm('Are you sure you want to delete this participant?')) return;
    try {
      await deleteParticipant(participantId);
      toast.success('Participant deleted successfully!');
      fetchParticipants();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete participant');
      console.error('Delete participant error:', error);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', phone: '', isActive: true });
    setEditingParticipant(null);
  };

  // Filter participants by search term (client-side)
  const filteredParticipants = participants.filter(participant => {
    if (!filters.search) return true;
    const searchLower = filters.search.toLowerCase();
    return (
      participant.name.toLowerCase().includes(searchLower) ||
      participant.email.toLowerCase().includes(searchLower) ||
      participant.participantId.toLowerCase().includes(searchLower) ||
      (participant.phone && participant.phone.includes(searchLower))
    );
  });

  if (loading && participants.length === 0) {
    return (
      <PageLayout title="👥 Participant Management">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading participants...</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="👥 Participant Management">
      <div className="technology-management">
        {/* Header */}
        <div className="page-header">
          <h1>👥 Participant Management</h1>
          <button
            className="btn btn-primary"
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
          >
            + Add Participant
          </button>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="filter-group">
            <label>Search:</label>
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search by name, email, ID..."
              style={{
                padding: '8px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '0.875rem',
                minWidth: '250px',
              }}
            />
          </div>
          <div className="filter-group">
            <label>Status:</label>
            <select
              name="isActive"
              value={
                filters.isActive === null
                  ? ''
                  : filters.isActive === true
                  ? 'true'
                  : 'false'
              }
              onChange={handleFilterChange}
            >
              <option value="">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          <button
            className="btn btn-secondary"
            onClick={() => setFilters({ isActive: null, search: '' })}
          >
            Clear Filters
          </button>
        </div>

        {/* Participants Table */}
        <div className="table-container">
          {filteredParticipants.length === 0 ? (
            <div className="empty-state">
              <p>
                {filters.search || filters.isActive !== null
                  ? 'No participants found matching your filters.'
                  : 'No participants registered yet. Add your first participant!'}
              </p>
            </div>
          ) : (
            <table className="eval-table">
              <thead>
                <tr>
                  <th>Participant ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredParticipants.map(participant => (
                  <tr key={participant._id || participant.participantId}>
                    <td>
                      <span
                        style={{
                          fontWeight: 600,
                          color: '#6366f1',
                          fontFamily: 'monospace',
                        }}
                      >
                        {participant.participantId}
                      </span>
                    </td>
                    <td>
                      <div className="participant-info">
                        <span className="name">{participant.name}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                        {participant.email}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                        {participant.phone || '—'}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          participant.isActive ? 'badge-success' : 'badge-secondary'
                        }`}
                      >
                        {participant.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                        {new Date(participant.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleEdit(participant)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(participant.participantId)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Summary */}
        <div style={{ marginTop: '16px', fontSize: '0.875rem', color: '#64748b' }}>
          Showing {filteredParticipants.length} of {participants.length} participants
        </div>

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>
                  {editingParticipant ? 'Edit Participant' : 'Add New Participant'}
                </h2>
                <button className="btn-close" onClick={() => setShowModal(false)}>
                  ✕
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., John Doe"
                    minLength={3}
                  />
                </div>
                <div className="form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., john.doe@example.com"
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="e.g., +1234567890 (optional)"
                  />
                </div>
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
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingParticipant ? 'Update Participant' : 'Add Participant'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default ParticipantManagement;