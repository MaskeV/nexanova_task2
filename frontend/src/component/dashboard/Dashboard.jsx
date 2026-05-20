import { useAuth } from '../../context/authContext';
import { useNavigate } from 'react-router-dom';
import '../../styles/Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      <nav className="navbar">
        <div className="navbar-brand">
          <div className="logo">E</div>
          <h2>Mock Evaluation System</h2>
        </div>
        <div className="navbar-menu">
          <span className="user-info">
            {user?.name} ({user?.role})
          </span>
          <button onClick={handleLogout} className="btn btn-secondary">
            Logout
          </button>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="welcome-section">
          <h1>Welcome, {user?.name}!</h1>
          <p className="text-muted">Role: <strong>{user?.role.toUpperCase()}</strong></p>
        </div>

        <div className="cards-grid">
          <div className="card">
            <div className="card-icon">📝</div>
            <h3>My Evaluations</h3>
            <p>View and manage your assigned evaluations</p>
            <span className="badge">Coming Soon</span>
          </div>

          <div className="card">
            <div className="card-icon">📊</div>
            <h3>Progress Tracking</h3>
            <p>Monitor your evaluation progress</p>
            <span className="badge">Coming Soon</span>
          </div>

          <div className="card">
            <div className="card-icon">📚</div>
            <h3>Evaluation Guidelines</h3>
            <p>Access evaluation standards and guidelines</p>
            <span className="badge">Coming Soon</span>
          </div>

          <div 
            className="card" 
            onClick={() => navigate('/change-password')}
            style={{ cursor: 'pointer' }}
          >
            <div className="card-icon">🔒</div>
            <h3>Change Password</h3>
            <p>Update your account password</p>
          </div>

          <div className="card">
            <div className="card-icon">❓</div>
            <h3>Help & Support</h3>
            <p>Get help with evaluation system</p>
            <span className="badge">Coming Soon</span>
          </div>

          <div className="card">
            <div className="card-icon">⚙️</div>
            <h3>Settings</h3>
            <p>Manage your account preferences</p>
            <span className="badge">Coming Soon</span>
          </div>
        </div>

        <div style={{ 
          marginTop: '3rem', 
          padding: '2rem', 
          backgroundColor: 'white', 
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-color)'
        }}>
          <h3 style={{ marginBottom: '1rem' }}>Quick Stats</h3>
          <div className="stats-grid">
            <div className="stat-box">
              <div className="stat-label">Evaluations Completed</div>
              <div className="stat-value">0</div>
              <div className="stat-change">+0% this month</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">Pending Evaluations</div>
              <div className="stat-value">0</div>
              <div className="stat-change">No pending</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">Average Score</div>
              <div className="stat-value">-</div>
              <div className="stat-change">No data yet</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">Last Activity</div>
              <div className="stat-value">-</div>
              <div className="stat-change">No activity</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;