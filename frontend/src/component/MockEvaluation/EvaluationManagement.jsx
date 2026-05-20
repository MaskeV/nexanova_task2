// frontend/src/components/MockEvaluation/EvaluationManagement.jsx - FIXED
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  assignEvaluation,
  getAllEvaluations,
  getBatchEvaluations,
  deleteEvaluation,
} from '../../services/evaluationService';
import { getAllBatches } from '../../services/batchService';
import { getAllTechnologies } from '../../services/technologyService';
import './MockEvaluation.css';

const EvaluationManagement = () => {
  const [evaluations, setEvaluations] = useState([]);
  const [batches, setBatches] = useState([]);
  const [technologies, setTechnologies] = useState([]);
  const [evaluators, setEvaluators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);

  // ✅ FIX: Use null instead of empty strings for filters
  const [filters, setFilters] = useState({
    batch: null,
    technology: null,
    status: null,
    round: null,
  });

  const [assignForm, setAssignForm] = useState({
    batchId: '',
    technologyId: '',
    roundNumber: 1,
    evaluatorId: '',
    participantIds: [],
  });

  const [selectedBatchParticipants, setSelectedBatchParticipants] = useState([]);
  const [selectedBatchRounds, setSelectedBatchRounds] = useState(1);

  // ✅ FIX: Separate initial load from filter-triggered loads
  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchEvaluations();
  }, [filters]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [batchesRes, techRes] = await Promise.all([
        getAllBatches({ isActive: true }),
        getAllTechnologies({ isActive: true }),
      ]);
      setBatches(batchesRes.data || []);
      setTechnologies(techRes.data || []);
      await fetchEvaluators();
      
      // Fetch evaluations with null filters (get all)
      await fetchEvaluations();
    } catch (error) {
      console.error('Failed to load initial data:', error);
      toast.error('Failed to load initial data');
    } finally {
      setLoading(false);
    }
  };

  const fetchEvaluators = async () => {
    try {
      const res = await fetch('/auth/users?role=evaluator', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await res.json();
      setEvaluators(data.data || []);
    } catch (error) {
      console.error('Failed to fetch evaluators:', error);
      // evaluators list may come from auth users endpoint
    }
  };

  const fetchEvaluations = async () => {
    try {
      setLoading(true);
      const res = await getAllEvaluations(filters);
      setEvaluations(res.data || []);
      console.log(`✅ Evaluations loaded:`, res.data); // Debug
    } catch (error) {
      console.error('Failed to fetch evaluations:', error);
      toast.error('Failed to fetch evaluations');
      setEvaluations([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    // ✅ FIX: Convert empty string to null
    setFilters((prev) => ({ 
      ...prev, 
      [name]: value === '' ? null : value 
    }));
  };

  const handleAssignFormChange = (e) => {
    const { name, value } = e.target;

    if (name === 'batchId') {
      const batch = batches.find((b) => b.batchId === value);
      setSelectedBatchParticipants(batch?.participants || []);
      const tech = technologies.find((t) => t.technologyId === batch?.technology);
      setSelectedBatchRounds(tech?.rounds || 1);
      setAssignForm((prev) => ({
        ...prev,
        batchId: value,
        technologyId: batch?.technology || '',
        participantIds: [],
        roundNumber: 1,
      }));
    } else {
      setAssignForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const toggleParticipant = (id) => {
    setAssignForm((prev) => ({
      ...prev,
      participantIds: prev.participantIds.includes(id)
        ? prev.participantIds.filter((p) => p !== id)
        : [...prev.participantIds, id],
    }));
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assignForm.participantIds.length) {
      toast.warning('Select at least one participant');
      return;
    }
    try {
      await assignEvaluation(assignForm);
      toast.success('Evaluation(s) assigned successfully!');
      setShowAssignModal(false);
      resetAssignForm();
      fetchEvaluations();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign evaluation');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this evaluation assignment?')) return;
    try {
      await deleteEvaluation(id);
      toast.success('Evaluation deleted');
      fetchEvaluations();
    } catch {
      toast.error('Failed to delete evaluation');
    }
  };

  const resetAssignForm = () => {
    setAssignForm({
      batchId: '',
      technologyId: '',
      roundNumber: 1,
      evaluatorId: '',
      participantIds: [],
    });
    setSelectedBatchParticipants([]);
    setSelectedBatchRounds(1);
  };

  const getStatusBadgeClass = (status) => {
    const map = {
      pending: 'badge-warning',
      'in-progress': 'badge-info',
      completed: 'badge-success',
      cancelled: 'badge-danger',
    };
    return map[status] || 'badge-secondary';
  };

  if (loading && evaluations.length === 0) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading evaluations...</p>
      </div>
    );
  }

  return (
    <div className="evaluation-management">
      <div className="page-header">
        <h1>📋 Evaluation Management</h1>
        <button
          className="btn btn-primary"
          onClick={() => {
            resetAssignForm();
            setShowAssignModal(true);
          }}
        >
          + Assign Evaluation
        </button>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Batch:</label>
          <select name="batch" value={filters.batch || ''} onChange={handleFilterChange}>
            <option value="">All Batches</option>
            {batches.map((b) => (
              <option key={b.batchId} value={b.batchId}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Technology:</label>
          <select name="technology" value={filters.technology || ''} onChange={handleFilterChange}>
            <option value="">All Technologies</option>
            {technologies.map((t) => (
              <option key={t.technologyId} value={t.technologyId}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Status:</label>
          <select name="status" value={filters.status || ''} onChange={handleFilterChange}>
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Round:</label>
          <select name="round" value={filters.round || ''} onChange={handleFilterChange}>
            <option value="">All Rounds</option>
            <option value="1">Round 1</option>
            <option value="2">Round 2</option>
            <option value="3">Round 3</option>
          </select>
        </div>

        <button
          className="btn btn-secondary"
          onClick={() => setFilters({ batch: null, technology: null, status: null, round: null })}
        >
          Clear
        </button>
      </div>

      {/* Evaluations Table */}
      <div className="table-container">
        {evaluations.length === 0 ? (
          <div className="empty-state">
            <p>No evaluations found. Assign some evaluations to get started!</p>
          </div>
        ) : (
          <table className="eval-table">
            <thead>
              <tr>
                <th>Participant</th>
                <th>Evaluator</th>
                <th>Batch</th>
                <th>Technology</th>
                <th>Round</th>
                <th>Status</th>
                <th>Score</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {evaluations.map((ev) => (
                <tr key={ev._id || ev.evaluationId}>
                  <td>
                    <div className="participant-info">
                      <span className="name">{ev.participant?.username || ev.participantName || '—'}</span>
                      <span className="email">{ev.participant?.email || ''}</span>
                    </div>
                  </td>
                  <td>{ev.evaluator?.username || ev.evaluatorName || '—'}</td>
                  <td>{ev.batch?.name || ev.batchName || '—'}</td>
                  <td>{ev.technology?.name || ev.technologyName || '—'}</td>
                  <td>
                    <span className="round-badge">Round {ev.roundNumber}</span>
                  </td>
                  <td>
                    <span className={`badge ${getStatusBadgeClass(ev.status)}`}>{ev.status}</span>
                  </td>
                  <td>
                    {ev.totalScore != null ? (
                      <strong>{ev.totalScore}</strong>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(ev._id || ev.evaluationId)}
                      disabled={ev.status === 'completed'}
                      title={ev.status === 'completed' ? 'Cannot delete completed evaluation' : ''}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Assign Evaluation Modal */}
      {showAssignModal && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Assign Evaluation</h2>
              <button className="btn-close" onClick={() => setShowAssignModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleAssignSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Batch *</label>
                  <select
                    name="batchId"
                    value={assignForm.batchId}
                    onChange={handleAssignFormChange}
                    required
                  >
                    <option value="">Select Batch</option>
                    {batches.map((b) => (
                      <option key={b.batchId} value={b.batchId}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Round *</label>
                  <select
                    name="roundNumber"
                    value={assignForm.roundNumber}
                    onChange={handleAssignFormChange}
                    required
                  >
                    {Array.from({ length: selectedBatchRounds }, (_, i) => i + 1).map((r) => (
                      <option key={r} value={r}>
                        Round {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Evaluator *</label>
                <select
                  name="evaluatorId"
                  value={assignForm.evaluatorId}
                  onChange={handleAssignFormChange}
                  required
                >
                  <option value="">Select Evaluator</option>
                  {evaluators.map((ev) => (
                    <option key={ev._id} value={ev._id}>
                      {ev.username} ({ev.email})
                    </option>
                  ))}
                </select>
                {evaluators.length === 0 && (
                  <p className="hint-text">
                    No evaluators found. Register users with the "evaluator" role first.
                  </p>
                )}
              </div>

              <div className="form-group">
                <label>Select Participants *</label>
                {selectedBatchParticipants.length === 0 ? (
                  <p className="hint-text">
                    {assignForm.batchId
                      ? 'No participants in this batch yet.'
                      : 'Select a batch first to see participants.'}
                  </p>
                ) : (
                  <div className="students-list">
                    {selectedBatchParticipants.map((p) => (
                      <label key={p._id} className="student-checkbox">
                        <input
                          type="checkbox"
                          checked={assignForm.participantIds.includes(p._id)}
                          onChange={() => toggleParticipant(p._id)}
                        />
                        {p.username} ({p.email})
                      </label>
                    ))}
                  </div>
                )}
                {assignForm.participantIds.length > 0 && (
                  <p className="selection-count">
                    {assignForm.participantIds.length} participant
                    {assignForm.participantIds.length > 1 ? 's' : ''} selected
                  </p>
                )}
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAssignModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Assign Evaluation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EvaluationManagement;