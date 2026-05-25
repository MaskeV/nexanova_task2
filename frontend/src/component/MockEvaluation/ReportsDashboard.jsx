// frontend/src/component/MockEvaluation/ReportsDashboard.jsx
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  generateBatchReport,
  generateTechnologyReport,
  getSystemStats,
  exportToCSV,
} from '../../services/reportService';
import { getAllBatches } from '../../services/batchService';
import { getAllTechnologies } from '../../services/technologyService';
import PageLayout from './PageLayout';
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

  useEffect(() => { fetchInitialData(); }, []);

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

      // ✅ FIXED: Backend returns nested structure:
      // { success: true, data: { batches: { total, active }, evaluations: { total, completed, ... }, ... } }
      const stats = statsRes?.data || statsRes || null;
      console.log('📊 Raw system stats:', stats);
      setSystemStats(stats);
    } catch (err) {
      console.error('fetchInitialData error:', err);
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBatchReport = async () => {
    if (!selectedBatch) { toast.warning('Please select a batch'); return; }
    try {
      setReportLoading(true);
      setReportData(null);
      const res = await generateBatchReport(selectedBatch);
      console.log('📦 Batch report raw response:', res);

      // Backend: { success, data: { batch, technology, statistics, participantResults } }
      const data = res?.data || res;
      const batch = batches.find(b => b.batchId === selectedBatch);
      setReportTitle(`Batch Report: ${batch?.name || selectedBatch}`);
      setReportData(data);
    } catch (err) {
      console.error('Batch report error:', err);
      toast.error('Failed to generate batch report');
    } finally {
      setReportLoading(false);
    }
  };

  const handleGenerateTechReport = async () => {
    if (!selectedTechnology) { toast.warning('Please select a technology'); return; }
    try {
      setReportLoading(true);
      setReportData(null);
      const res = await generateTechnologyReport(selectedTechnology);
      console.log('🔧 Tech report raw response:', res);

      // Backend: { success, data: { technology, statistics, roundStatistics, batches } }
      const data = res?.data || res;
      const tech = technologies.find(t => t.technologyId === selectedTechnology);
      setReportTitle(`Technology Report: ${tech?.name || selectedTechnology}`);
      setReportData(data);
    } catch (err) {
      console.error('Tech report error:', err);
      toast.error('Failed to generate technology report');
    } finally {
      setReportLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!reportData) return;

    let rows = [];
    if (activeTab === 'batch' && reportData.participantResults) {
      rows = reportData.participantResults.map(r => ({
        participant: r.participant?.username || r.participant?.name || '—',
        email: r.participant?.email || '—',
        totalEvaluations: r.totalEvaluations,
        completedEvaluations: r.completedEvaluations,
        pendingEvaluations: r.pendingEvaluations,
        totalScore: r.totalScore,
        averageScore: r.averageScore,
      }));
    } else if (activeTab === 'technology' && reportData.batches) {
      rows = reportData.batches.map(b => ({
        batchId: b.batchId,
        name: b.name,
        status: b.status,
        participantCount: b.participantCount,
      }));
    }

    if (rows.length === 0) { toast.warning('No data to export'); return; }
    exportToCSV(rows, reportTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase());
    toast.success('Report exported as CSV!');
  };

  // ✅ FIXED: Parse system stats correctly from backend structure
  const parseStats = (stats) => {
    if (!stats) return null;
    return {
      totalBatches:          stats.batches?.total          ?? stats.totalBatches          ?? '—',
      totalParticipants:     stats.users?.participants      ?? stats.totalParticipants     ?? '—',
      totalEvaluations:      stats.evaluations?.total       ?? stats.totalEvaluations      ?? '—',
      completedEvaluations:  stats.evaluations?.completed   ?? stats.completedEvaluations  ?? '—',
      completionRate:        stats.evaluations?.completionRate ?? stats.completionRate     ?? '—',
    };
  };

  const parsedStats = parseStats(systemStats);

  if (loading) {
    return (
      <PageLayout title="📊 Reports & Analytics">
        <div className="loading-container"><div className="spinner"></div><p>Loading reports...</p></div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="📊 Reports & Analytics">
      <div className="reports-dashboard">
        <div className="page-header">
          <h1>📊 Reports & Analytics</h1>
        </div>

        {/* ── System Stats ── */}
        {parsedStats && (
          <div className="stats-overview">
            {[
              { label: 'Total Batches',  value: parsedStats.totalBatches,         color: '#8b5cf6' },
              { label: 'Participants',   value: parsedStats.totalParticipants,    color: '#3b82f6' },
              { label: 'Evaluations',   value: parsedStats.totalEvaluations,     color: '#f59e0b' },
              { label: 'Completed',     value: parsedStats.completedEvaluations, color: '#10b981' },
              { label: 'Completion',    value: parsedStats.completionRate,        color: '#ef4444' },
            ].map(s => (
              <div key={s.label} className="stat-card" style={{ borderTop: `3px solid ${s.color}` }}>
                <span className="stat-number" style={{ color: s.color }}>{s.value}</span>
                <span className="stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── Tabs ── */}
        <div className="report-tabs">
          <button className={`tab-btn ${activeTab === 'batch' ? 'active' : ''}`}
            onClick={() => { setActiveTab('batch'); setReportData(null); }}>
            Batch Report
          </button>
          <button className={`tab-btn ${activeTab === 'technology' ? 'active' : ''}`}
            onClick={() => { setActiveTab('technology'); setReportData(null); }}>
            Technology Report
          </button>
        </div>

        {/* ── Batch Report Controls ── */}
        {activeTab === 'batch' && (
          <div className="report-section">
            <h3>Generate Batch Evaluation Report</h3>
            <p className="section-description">View all participant scores within a specific batch.</p>
            <div className="report-controls">
              <select value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)} className="report-select">
                <option value="">Select a Batch</option>
                {batches.map(b => (
                  <option key={b.batchId} value={b.batchId}>
                    {b.name} ({b.technologyDetails?.name || b.technology})
                  </option>
                ))}
              </select>
              <button className="btn btn-primary" onClick={handleGenerateBatchReport}
                disabled={reportLoading || !selectedBatch}>
                {reportLoading ? 'Generating...' : 'Generate Report'}
              </button>
            </div>
          </div>
        )}

        {/* ── Technology Report Controls ── */}
        {activeTab === 'technology' && (
          <div className="report-section">
            <h3>Generate Technology-Wise Report</h3>
            <p className="section-description">View average scores per round for a specific technology.</p>
            <div className="report-controls">
              <select value={selectedTechnology} onChange={e => setSelectedTechnology(e.target.value)} className="report-select">
                <option value="">Select a Technology</option>
                {technologies.map(t => <option key={t.technologyId} value={t.technologyId}>{t.name}</option>)}
              </select>
              <button className="btn btn-primary" onClick={handleGenerateTechReport}
                disabled={reportLoading || !selectedTechnology}>
                {reportLoading ? 'Generating...' : 'Generate Report'}
              </button>
            </div>
          </div>
        )}

        {/* ── Report Results ── */}
        {reportData && (
          <div className="report-results">
            <div className="report-results-header">
              <h3>{reportTitle}</h3>
              <button className="btn btn-secondary" onClick={handleExportCSV}>⬇ Export CSV</button>
            </div>

            {/* ── BATCH REPORT OUTPUT ── */}
            {activeTab === 'batch' && (
              <>
                {/* Summary statistics */}
                {reportData.statistics && (
                  <div style={{
                    display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 24
                  }}>
                    {[
                      { label: 'Total Participants', value: reportData.statistics.totalParticipants },
                      { label: 'Total Evaluations',  value: reportData.statistics.totalEvaluations },
                      { label: 'Completed',          value: reportData.statistics.completedEvaluations },
                      { label: 'Pending',            value: reportData.statistics.pendingEvaluations },
                      { label: 'Avg Score',          value: reportData.statistics.averageBatchScore },
                      { label: 'Completion Rate',    value: reportData.statistics.completionRate },
                    ].map(s => (
                      <div key={s.label} style={{
                        background: '#f8fafc', border: '1px solid #e2e8f0',
                        borderRadius: 8, padding: '10px 16px', textAlign: 'center', minWidth: 110
                      }}>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#3b82f6' }}>{s.value ?? '—'}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Participant results table */}
                {reportData.participantResults && reportData.participantResults.length > 0 ? (
                  <div className="table-container">
                    <table className="eval-table">
                      <thead>
                        <tr>
                          <th>Participant</th>
                          <th>Email</th>
                          <th>Total Evaluations</th>
                          <th>Completed</th>
                          <th>Pending</th>
                          <th>Total Score</th>
                          <th>Avg Score</th>
                          <th>Round Scores</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.participantResults.map((row, idx) => (
                          <tr key={idx}>
                            <td><strong>{row.participant?.username || row.participant?.name || '—'}</strong></td>
                            <td>{row.participant?.email || '—'}</td>
                            <td>{row.totalEvaluations}</td>
                            <td><span className="badge badge-success">{row.completedEvaluations}</span></td>
                            <td><span className="badge badge-warning">{row.pendingEvaluations}</span></td>
                            <td><strong>{row.totalScore}</strong></td>
                            <td><strong>{row.averageScore}</strong></td>
                            <td>
                              {Object.entries(row.roundScores || {}).map(([round, score]) => (
                                <span key={round} style={{
                                  display: 'inline-block', marginRight: 6,
                                  background: '#ede9fe', color: '#7c3aed',
                                  borderRadius: 4, padding: '2px 6px', fontSize: '0.75rem'
                                }}>
                                  {round}: {score}
                                </span>
                              ))}
                              {Object.keys(row.roundScores || {}).length === 0 && <span className="muted">—</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="empty-state">
                    <p>No participant evaluation data found for this batch yet.</p>
                  </div>
                )}
              </>
            )}

            {/* ── TECHNOLOGY REPORT OUTPUT ── */}
            {activeTab === 'technology' && (
              <>
                {/* Overall statistics */}
                {reportData.statistics && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
                    {[
                      { label: 'Total Batches',    value: reportData.statistics.totalBatches },
                      { label: 'Total Evaluations', value: reportData.statistics.totalEvaluations },
                      { label: 'Completed',         value: reportData.statistics.completedEvaluations },
                      { label: 'Pending',           value: reportData.statistics.pendingEvaluations },
                      { label: 'Avg Score',         value: reportData.statistics.averageScore },
                      { label: 'Completion Rate',   value: reportData.statistics.completionRate },
                    ].map(s => (
                      <div key={s.label} style={{
                        background: '#f8fafc', border: '1px solid #e2e8f0',
                        borderRadius: 8, padding: '10px 16px', textAlign: 'center', minWidth: 110
                      }}>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#3b82f6' }}>{s.value ?? '—'}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Round statistics */}
                {reportData.roundStatistics && Object.keys(reportData.roundStatistics).length > 0 && (
                  <div className="round-averages" style={{ marginBottom: 24 }}>
                    <h4>Round Statistics</h4>
                    <div className="averages-grid">
                      {Object.entries(reportData.roundStatistics).map(([round, stats]) => (
                        <div key={round} className="average-card">
                          <span className="avg-round">{round}</span>
                          <span className="avg-score">{stats.averageScore ?? '—'}</span>
                          <span className="avg-count">{stats.totalEvaluations} evaluations</span>
                          {stats.highestScore > 0 && (
                            <span style={{ fontSize: '0.7rem', color: '#10b981' }}>
                              High: {stats.highestScore}
                            </span>
                          )}
                          {stats.lowestScore > 0 && (
                            <span style={{ fontSize: '0.7rem', color: '#ef4444' }}>
                              Low: {stats.lowestScore}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Batches using this technology */}
                {reportData.batches && reportData.batches.length > 0 ? (
                  <div className="table-container">
                    <table className="eval-table">
                      <thead>
                        <tr>
                          <th>Batch ID</th>
                          <th>Name</th>
                          <th>Status</th>
                          <th>Participants</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.batches.map((b, idx) => (
                          <tr key={idx}>
                            <td><code>{b.batchId}</code></td>
                            <td><strong>{b.name}</strong></td>
                            <td>
                              <span className={`badge badge-${
                                b.status === 'ongoing' ? 'success' :
                                b.status === 'completed' ? 'secondary' :
                                b.status === 'scheduled' ? 'info' : 'danger'
                              }`}>{b.status}</span>
                            </td>
                            <td>{b.participantCount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="empty-state">
                    <p>No batch data found for this technology yet.</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default ReportsDashboard;