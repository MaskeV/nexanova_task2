// frontend/src/components/MockEvaluation/EvaluatorDashboard.jsx
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  getMyEvaluations,
  submitEvaluation,
  getEvaluationById,
} from '../../services/evaluationService';
import './MockEvaluation.css';

const EvaluatorDashboard = () => {
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [scoreData, setScoreData] = useState({ scores: [], comments: '' });
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchEvaluations();
  }, [statusFilter]);

  const fetchEvaluations = async () => {
    try {
      setLoading(true);
      const res = await getMyEvaluations({ status: statusFilter });
      setEvaluations(res.data || []);
    } catch {
      toast.error('Failed to load your evaluations');
    } finally {
      setLoading(false);
    }
  };

  const openEvaluationForm = async (evaluation) => {
    try {
      const res = await getEvaluationById(evaluation._id || evaluation.evaluationId);
      const ev = res.data || evaluation;
      setSelectedEvaluation(ev);

      // Build score entries from evaluation criteria
      const criteria = ev.technology?.evaluationCriteria?.filter(
        (c) => c.roundNumber === ev.roundNumber
      ) || [];

      const existingScores = ev.scores || [];

      const initialScores = criteria.map((c) => {
        const existing = existingScores.find(
          (s) => s.criteriaName === c.criteriaName
        );
        return {
          criteriaName: c.criteriaName,
          maxScore: c.maxScore,
          score: existing?.score ?? '',
          description: c.description || '',
        };
      });

      // If no criteria defined, provide a single default score field
      if (initialScores.length === 0) {
        initialScores.push({
          criteriaName: 'Overall Score',
          maxScore: 100,
          score: ev.totalScore ?? '',
          description: '',
        });
      }

      setScoreData({
        scores: initialScores,
        comments: ev.comments || '',
      });
      setShowFormModal(true);
    } catch {
      toast.error('Failed to load evaluation details');
    }
  };

  const handleScoreChange = (index, value) => {
    setScoreData((prev) => {
      const updated = [...prev.scores];
      const max = updated[index].maxScore;
      const parsed = parseFloat(value);
      updated[index] = {
        ...updated[index],
        score: isNaN(parsed) ? '' : Math.min(parsed, max),
      };
      return { ...prev, scores: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const invalid = scoreData.scores.some((s) => s.score === '' || s.score < 0);
    if (invalid) {
      toast.warning('Please fill in all scores');
      return;
    }

    try {
      setSubmitting(true);
      const totalScore = scoreData.scores.reduce((sum, s) => sum + parseFloat(s.score), 0);
      await submitEvaluation(
        selectedEvaluation._id || selectedEvaluation.evaluationId,
        {
          scores: scoreData.scores,
          comments: scoreData.comments,
          totalScore,
        }
      );
      toast.success('Evaluation submitted successfully!');
      setShowFormModal(false);
      fetchEvaluations();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit evaluation');
    } finally {
      setSubmitting(false);
    }
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

  const totalPossible = scoreData.scores.reduce((sum, s) => sum + s.maxScore, 0);
  const currentTotal = scoreData.scores.reduce(
    (sum, s) => sum + (parseFloat(s.score) || 0),
    0
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading your evaluations...</p>
      </div>
    );
  }

  return (
    <div className="evaluator-dashboard">
      <div className="page-header">
        <h1>🎯 My Evaluations</h1>
        <div className="header-filters">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <span className="summary-number">
            {evaluations.filter((e) => e.status === 'pending').length}
          </span>
          <span className="summary-label">Pending</span>
        </div>
        <div className="summary-card">
          <span className="summary-number">
            {evaluations.filter((e) => e.status === 'in-progress').length}
          </span>
          <span className="summary-label">In Progress</span>
        </div>
        <div className="summary-card">
          <span className="summary-number">
            {evaluations.filter((e) => e.status === 'completed').length}
          </span>
          <span className="summary-label">Completed</span>
        </div>
        <div className="summary-card">
          <span className="summary-number">{evaluations.length}</span>
          <span className="summary-label">Total</span>
        </div>
      </div>

      {/* Evaluation Cards */}
      {evaluations.length === 0 ? (
        <div className="empty-state">
          <p>No evaluations assigned to you yet.</p>
        </div>
      ) : (
        <div className="evaluations-list">
          {evaluations.map((ev) => (
            <div key={ev._id || ev.evaluationId} className="evaluation-card">
              <div className="eval-card-header">
                <div className="eval-participant">
                  <h3>{ev.participant?.username || ev.participantName || 'Participant'}</h3>
                  <span className="eval-email">
                    {ev.participant?.email || ''}
                  </span>
                </div>
                <span className={`badge ${getStatusBadgeClass(ev.status)}`}>
                  {ev.status}
                </span>
              </div>

              <div className="eval-card-meta">
                <span>📦 {ev.batch?.name || ev.batchName || '—'}</span>
                <span>🔧 {ev.technology?.name || ev.technologyName || '—'}</span>
                <span className="round-badge">Round {ev.roundNumber}</span>
              </div>

              {ev.status === 'completed' && ev.totalScore != null && (
                <div className="eval-score-display">
                  <span>Score: </span>
                  <strong>{ev.totalScore}</strong>
                  {ev.comments && <p className="eval-comments">"{ev.comments}"</p>}
                </div>
              )}

              {ev.status !== 'completed' && ev.status !== 'cancelled' && (
                <div className="eval-card-actions">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => openEvaluationForm(ev)}
                  >
                    {ev.status === 'in-progress' ? 'Continue Evaluation' : 'Start Evaluation'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Evaluation Form Modal */}
      {showFormModal && selectedEvaluation && (
        <div className="modal-overlay" onClick={() => setShowFormModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Evaluation Form</h2>
                <p className="modal-subtitle">
                  {selectedEvaluation.participant?.username} —{' '}
                  {selectedEvaluation.technology?.name} · Round {selectedEvaluation.roundNumber}
                </p>
              </div>
              <button className="btn-close" onClick={() => setShowFormModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="score-progress">
                <span>
                  Current Total: <strong>{currentTotal}</strong> / {totalPossible}
                </span>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${(currentTotal / totalPossible) * 100}%` }}
                  />
                </div>
              </div>

              <div className="criteria-scoring">
                {scoreData.scores.map((item, idx) => (
                  <div key={idx} className="criteria-score-row">
                    <div className="criteria-info">
                      <label>{item.criteriaName}</label>
                      {item.description && (
                        <span className="criteria-desc">{item.description}</span>
                      )}
                    </div>
                    <div className="score-input-wrapper">
                      <input
                        type="number"
                        min="0"
                        max={item.maxScore}
                        step="0.5"
                        value={item.score}
                        onChange={(e) => handleScoreChange(idx, e.target.value)}
                        placeholder="0"
                        required
                        className="score-input"
                      />
                      <span className="score-max">/ {item.maxScore}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="form-group">
                <label>Comments / Feedback</label>
                <textarea
                  value={scoreData.comments}
                  onChange={(e) =>
                    setScoreData((prev) => ({ ...prev, comments: e.target.value }))
                  }
                  rows={4}
                  placeholder="Write feedback for the participant..."
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowFormModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Evaluation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EvaluatorDashboard;