import { useAuth } from '../../context/authContext';
import { useNavigate } from 'react-router-dom';
import '../../styles/Dashboard.css';

const AdminDashboard = () => {
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
          <div className="logo">A</div>
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
          <p className="text-muted">Role: <strong>{user?.role.toUpperCase()} - ADMIN PANEL</strong></p>
        </div>

        {/* Admin Stats */}
        <div style={{ 
          marginBottom: '3rem', 
          padding: '0'
        }}>
          <h3 style={{ marginBottom: '1rem' }}>System Overview</h3>
          <div className="stats-grid">
            <div className="stat-box">
              <div className="stat-label">Total Users</div>
              <div className="stat-value">0</div>
              <div className="stat-change">+0% this month</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">Active Evaluators</div>
              <div className="stat-value">0</div>
              <div className="stat-change">Online now</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">Total Evaluations</div>
              <div className="stat-value">0</div>
              <div className="stat-change">In progress</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">System Health</div>
              <div className="stat-value" style={{ color: 'var(--success)' }}>✓</div>
              <div className="stat-change">All systems operational</div>
            </div>
          </div>
        </div>

        {/* Admin Cards Grid */}
        <div className="cards-grid">
          <div 
            className="card" 
            onClick={() => navigate('/users')}
            style={{ cursor: 'pointer' }}
          >
            <div className="card-icon">👥</div>
            <h3>User Management</h3>
            <p>Manage admins and evaluators, create accounts</p>
          </div>

          <div className="card">
            <div className="card-icon">📚</div>
            <h3>Batches</h3>
            <p>Create and manage evaluation batches</p>
            <span className="badge">Coming Soon</span>
          </div>

          <div className="card">
            <div className="card-icon">💻</div>
            <h3>Technologies</h3>
            <p>Manage technology tracks and categories</p>
            <span className="badge">Coming Soon</span>
          </div>

          <div className="card">
            <div className="card-icon">📊</div>
            <h3>Reports</h3>
            <p>View detailed evaluation reports</p>
            <span className="badge">Coming Soon</span>
          </div>

          <div className="card">
            <div className="card-icon">📋</div>
            <h3>Evaluations</h3>
            <p>Monitor all ongoing evaluations</p>
            <span className="badge">Coming Soon</span>
          </div>

          <div className="card">
            <div className="card-icon">⚙️</div>
            <h3>System Settings</h3>
            <p>Configure system parameters and rules</p>
            <span className="badge">Coming Soon</span>
          </div>

          <div className="card">
            <div className="card-icon">📧</div>
            <h3>Notifications</h3>
            <p>Manage notifications and email settings</p>
            <span className="badge">Coming Soon</span>
          </div>

          <div className="card">
            <div className="card-icon">🔐</div>
            <h3>Security</h3>
            <p>User logs and security settings</p>
            <span className="badge">Coming Soon</span>
          </div>

          <div 
            className="card" 
            onClick={() => navigate('/change-password')}
            style={{ cursor: 'pointer' }}
          >
            <div className="card-icon">🔒</div>
            <h3>Change Password</h3>
            <p>Update your admin account password</p>
          </div>
        </div>

        {/* Recent Activity */}
        <div style={{ 
          marginTop: '3rem', 
          padding: '2rem', 
          backgroundColor: 'white', 
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-color)'
        }}>
          <h3 style={{ marginBottom: '1rem' }}>Recent Activity</h3>
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <h3>No recent activity</h3>
            <p>Activity logs will appear here</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;