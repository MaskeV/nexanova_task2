// frontend/src/components/MockEvaluation/ReportsDashboard.jsx
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  generateBatchReport,
  generateTechnologyReport,
  generateParticipantReport,
  getSystemStats,
  exportToCSV,
} from '../../services/reportService';
import { getAllBatches } from '../../services/batchService';
import { getAllTechnologies } from '../../services/technologyService';
import './MockEvaluation.css';

const ReportsDashboard = () => {
  const [batches, setBatches] = useState([]);
  const [technologies, setTechnologies] = useState([]);
  const [systemStats, setSystemStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);

  const [activeTab, setActiveTab] = useState('batch');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedTechnology, setSelectedTechnology] = useState('');
  const [reportData, setReportData] = useState(null);
  const [reportTitle, setReportTitle] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [batchesRes, techRes, statsRes] = await Promise.all([
        getAllBatches(),
        getAllTechnologies(),
        getSystemStats().catch(() => ({ data: null })),
      ]);
      setBatches(batchesRes.data || []);
      setTechnologies(techRes.data || []);
      setSystemStats(statsRes.data || null);
    } catch {
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBatchReport = async () => {
    if (!selectedBatch) {
      toast.warning('Please select a batch');
      return;
    }
    try {
      setReportLoading(true);
      setReportData(null);
      const res = await generateBatchReport(selectedBatch);
      const batch = batches.find((b) => b.batchId === selectedBatch);
      setReportTitle(`Batch Report: ${batch?.name || selectedBatch}`);
      setReportData(res.data || res);
    } catch {
      toast.error('Failed to generate batch report');
    } finally {
      setReportLoading(false);
    }
  };

  const handleGenerateTechReport = async () => {
    if (!selectedTechnology) {
      toast.warning('Please select a technology');
      return;
    }
    try {
      setReportLoading(true);
      setReportData(null);
      const res = await generateTechnologyReport(selectedTechnology);
      const tech = technologies.find((t) => t.technologyId === selectedTechnology);
      setReportTitle(`Technology Report: ${tech?.name || selectedTechnology}`);
      setReportData(res.data || res);
    } catch {
      toast.error('Failed to generate technology report');
    } finally {
      setReportLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!reportData) return;

    const rows = Array.isArray(reportData)
      ? reportData
      : reportData.participants || reportData.evaluations || [reportData];

    const flatRows = rows.map((r) => ({
      participant: r.participant?.username || r.participantName || r.name || '—',
      email: r.participant?.email || r.email || '—',
      batch: r.batch?.name || r.batchName || '—',
      technology: r.technology?.name || r.technologyName || '—',
      round: r.roundNumber || '—',
      status: r.status || '—',
      totalScore: r.totalScore ?? '—',
      comments: r.comments || '',
    }));

    exportToCSV(flatRows, reportTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase());
    toast.success('Report exported as CSV!');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading reports...</p>
      </div>
    );
  }

  return (
    <div className="reports-dashboard">
      <div className="page-header">
        <h1>📊 Reports & Analytics</h1>
      </div>

      {/* System Stats */}
      {systemStats && (
        <div className="stats-overview">
          <div className="stat-card">
            <span className="stat-number">{systemStats.totalBatches ?? '—'}</span>
            <span className="stat-label">Total Batches</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{systemStats.totalParticipants ?? '—'}</span>
            <span className="stat-label">Participants</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{systemStats.totalEvaluations ?? '—'}</span>
            <span className="stat-label">Evaluations</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{systemStats.completedEvaluations ?? '—'}</span>
            <span className="stat-label">Completed</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">
              {systemStats.averageScore != null
                ? systemStats.averageScore.toFixed(1)
                : '—'}
            </span>
            <span className="stat-label">Avg Score</span>
          </div>
        </div>
      )}

      {/* Report Type Tabs */}
      <div className="report-tabs">
        <button
          className={`tab-btn ${activeTab === 'batch' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('batch');
            setReportData(null);
          }}
        >
          Batch Report
        </button>
        <button
          className={`tab-btn ${activeTab === 'technology' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('technology');
            setReportData(null);
          }}
        >
          Technology Report
        </button>
      </div>

      {/* Batch Report Section */}
      {activeTab === 'batch' && (
        <div className="report-section">
          <h3>Generate Batch Evaluation Report</h3>
          <p className="section-description">
            View all participant scores within a specific batch and technology.
          </p>
          <div className="report-controls">
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="report-select"
            >
              <option value="">Select a Batch</option>
              {batches.map((b) => (
                <option key={b.batchId} value={b.batchId}>
                  {b.name} ({b.technologyDetails?.name || b.technology})
                </option>
              ))}
            </select>
            <button
              className="btn btn-primary"
              onClick={handleGenerateBatchReport}
              disabled={reportLoading || !selectedBatch}
            >
              {reportLoading ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        </div>
      )}

      {/* Technology Report Section */}
      {activeTab === 'technology' && (
        <div className="report-section">
          <h3>Generate Technology-Wise Report</h3>
          <p className="section-description">
            View average scores per round for a specific technology.
          </p>
          <div className="report-controls">
            <select
              value={selectedTechnology}
              onChange={(e) => setSelectedTechnology(e.target.value)}
              className="report-select"
            >
              <option value="">Select a Technology</option>
              {technologies.map((t) => (
                <option key={t.technologyId} value={t.technologyId}>
                  {t.name}
                </option>
              ))}
            </select>
            <button
              className="btn btn-primary"
              onClick={handleGenerateTechReport}
              disabled={reportLoading || !selectedTechnology}
            >
              {reportLoading ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        </div>
      )}

      {/* Report Results */}
      {reportData && (
        <div className="report-results">
          <div className="report-results-header">
            <h3>{reportTitle}</h3>
            <button className="btn btn-secondary" onClick={handleExportCSV}>
              ⬇ Export CSV
            </button>
          </div>

          {/* Render round averages if technology report */}
          {reportData.roundAverages && (
            <div className="round-averages">
              <h4>Average Scores by Round</h4>
              <div className="averages-grid">
                {reportData.roundAverages.map((ra) => (
                  <div key={ra.round} className="average-card">
                    <span className="avg-round">Round {ra.round}</span>
                    <span className="avg-score">{ra.averageScore?.toFixed(1) ?? '—'}</span>
                    <span className="avg-count">{ra.count} evaluations</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Evaluations table */}
          {(() => {
            const rows = Array.isArray(reportData)
              ? reportData
              : reportData.participants ||
                reportData.evaluations ||
                (reportData.data ? [reportData.data] : []);

            return rows.length > 0 ? (
              <div className="table-container">
                <table className="eval-table">
                  <thead>
                    <tr>
                      <th>Participant</th>
                      <th>Email</th>
                      <th>Technology</th>
                      <th>Round</th>
                      <th>Status</th>
                      <th>Total Score</th>
                      <th>Comments</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, idx) => (
                      <tr key={idx}>
                        <td>
                          {row.participant?.username || row.participantName || row.name || '—'}
                        </td>
                        <td>{row.participant?.email || row.email || '—'}</td>
                        <td>{row.technology?.name || row.technologyName || '—'}</td>
                        <td>{row.roundNumber || '—'}</td>
                        <td>
                          <span className={`badge badge-${row.status === 'completed' ? 'success' : 'warning'}`}>
                            {row.status || '—'}
                          </span>
                        </td>
                        <td>
                          <strong>{row.totalScore ?? '—'}</strong>
                        </td>
                        <td>{row.comments || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <p>No evaluation data found for the selected criteria.</p>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default ReportsDashboard;