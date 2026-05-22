import { useAuth } from '../../context/authContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getMyEvaluations } from '../../services/evaluationService';
import '../../styles/Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [evalStats, setEvalStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyEvaluations()
      .then(res => {
        const evals = res.data || [];
        setEvalStats({
          total:     evals.length,
          pending:   evals.filter(e => e.status === 'pending').length,
          inProgress:evals.filter(e => e.status === 'in-progress').length,
          completed: evals.filter(e => e.status === 'completed').length,
        });
      })
      .catch(() => setEvalStats(null))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const cards = [
    {
      icon: '📝',
      title: 'My Evaluations',
      description: 'View and submit your assigned evaluations',
      route: '/my-evaluations',
      live: true,
    },
    {
      icon: '📊',
      title: 'Progress Tracking',
      description: 'Monitor your evaluation progress',
      live: false,
    },
    {
      icon: '📚',
      title: 'Evaluation Guidelines',
      description: 'Access evaluation standards and guidelines',
      live: false,
    },
    {
      icon: '❓',
      title: 'Help & Support',
      description: 'Get help with evaluation system',
      live: false,
    },
    {
      icon: '⚙️',
      title: 'Settings',
      description: 'Manage your account preferences',
      live: false,
    },
  ];

  return (
    <div className="dashboard-container">
      <nav className="navbar">
        <div className="navbar-brand">
          <div className="logo">E</div>
          <h2>Mock Evaluation System</h2>
        </div>
        <div className="navbar-menu">
          <span className="user-info">{user?.name} · Evaluator</span>
          <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="welcome-section">
          <h1>Welcome, {user?.name}!</h1>
        </div>

        {/* Quick Stats */}
        <div style={{ marginBottom: '2.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Quick Stats</h3>
          <div className="stats-grid">
            <div className="stat-box">
              <div className="stat-label">Pending</div>
              <div className="stat-value" style={{ color: '#f59e0b' }}>
                {loading ? '…' : (evalStats?.pending ?? '—')}
              </div>
              <div className="stat-change">Awaiting your review</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">In Progress</div>
              <div className="stat-value" style={{ color: '#3b82f6' }}>
                {loading ? '…' : (evalStats?.inProgress ?? '—')}
              </div>
              <div className="stat-change">Currently open</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">Completed</div>
              <div className="stat-value" style={{ color: '#10b981' }}>
                {loading ? '…' : (evalStats?.completed ?? '—')}
              </div>
              <div className="stat-change">All time</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">Total Assigned</div>
              <div className="stat-value">
                {loading ? '…' : (evalStats?.total ?? '—')}
              </div>
              <div className="stat-change">Across all rounds</div>
            </div>
          </div>
        </div>

        {/* Cards */}
        <div className="cards-grid">
          {cards.map((card) => (
            <div
              key={card.title}
              className="card"
              onClick={() => card.live && card.route && navigate(card.route)}
              style={{ cursor: card.live ? 'pointer' : 'default' }}
            >
              <div className="card-icon">{card.icon}</div>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
              {!card.live && <span className="badge">Coming Soon</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;