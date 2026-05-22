import { useAuth } from '../../context/authContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getSystemStats } from '../../services/reportService';
import '../../styles/Dashboard.css';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    getSystemStats()
      .then(res => setStats(res.data || res))
      .catch(() => setStats(null))
      .finally(() => setStatsLoading(false));
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const adminCards = [
    {
      icon: '👥',
      title: 'User Management',
      description: 'Manage admins and evaluators, create and delete accounts',
      route: '/users',
      color: '#3b82f6',
    },
    {
      icon: '📦',
      title: 'Batches',
      description: 'Create, edit, and manage evaluation batches with participants',
      route: '/batches',
      color: '#8b5cf6',
    },
    {
      icon: '💻',
      title: 'Technologies',
      description: 'Manage technology tracks, rounds, and evaluation criteria',
      route: '/technologies',
      color: '#06b6d4',
    },
    {
      icon: '📋',
      title: 'Evaluations',
      description: 'Assign evaluators to participants, monitor all evaluations',
      route: '/evaluations',
      color: '#f59e0b',
    },
    {
      icon: '📊',
      title: 'Reports & Analytics',
      description: 'View detailed batch and technology reports, export to CSV',
      route: '/reports',
      color: '#10b981',
    },
  
  ];

  const statItems = [
    { label: 'Total Batches',         value: stats?.totalBatches,          icon: '📦', color: '#8b5cf6' },
    { label: 'Participants',           value: stats?.totalParticipants,     icon: '🎓', color: '#3b82f6' },
    { label: 'Total Evaluations',      value: stats?.totalEvaluations,      icon: '📋', color: '#f59e0b' },
    { label: 'Completed',              value: stats?.completedEvaluations,  icon: '✅', color: '#10b981' },
    { label: 'Avg Score',              value: stats?.averageScore != null ? Number(stats.averageScore).toFixed(1) : null, icon: '⭐', color: '#ef4444' },
  ];

  return (
    <div className="dashboard-container">
      {/* ── Navbar ── */}
      <nav className="navbar">
        <div className="navbar-brand">
          <div className="logo">A</div>
          <h2>Mock Evaluation System</h2>
        </div>
        <div className="navbar-menu">
          <span className="user-info">{user?.name} · Admin</span>
          <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
        </div>
      </nav>

      <div className="dashboard-content">
        {/* ── Welcome ── */}
        <div className="welcome-section">
          <h1>Welcome back, {user?.name}!</h1>
        </div>

       

        {/* ── Admin Cards ── */}
        <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Quick Actions</h3>
        <div className="cards-grid">
          {adminCards.map((card) => (
            <div
              key={card.route}
              className="card"
              onClick={() => navigate(card.route)}
              style={{ cursor: 'pointer', borderTop: `3px solid ${card.color}` }}
            >
              <div className="card-icon" style={{ background: `${card.color}18`, color: card.color }}>
                {card.icon}
              </div>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;