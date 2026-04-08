import { useState, useEffect } from 'react';
import OperatorSidebar from './OperatorSidebar';
import Dashboard from './Dashboard';
import DeviceManagement from './DeviceManagement';
import ActivityLog from './ActivityLog';
import Login from './Login';

interface User {
  user_id: string;
  username: string;
  email: string;
  full_name: string;
  role: string;
}

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('operator-dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('aqua_vision_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch {
        localStorage.removeItem('aqua_vision_user');
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('aqua_vision_user', JSON.stringify(userData));
    
    // Redirect based on role
    if (userData.role === 'operator') {
      setCurrentPage('operator-dashboard');
    } else {
      setCurrentPage('admin-dashboard');
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('aqua_vision_user');
  };

  // Show loading state
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a1f42 0%, #0F2854 50%, #1C4D8D 100%)'
      }}>
        <div style={{ color: '#BDE8F5', fontSize: '18px' }}>Loading...</div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const renderContent = () => {
    // Operator pages
    if (user.role === 'operator') {
      switch (currentPage) {
        case 'operator-dashboard':
        case 'dashboard':
          return <Dashboard userName={user.full_name} userRole={user.role} userId={user.user_id} />;
        case 'devices':
          return <DeviceManagement userId={user.user_id} userName={user.full_name} />;
        case 'activity':
          return <ActivityLog userId={user.user_id} userName={user.full_name} />;
        default:
          return <Dashboard userName={user.full_name} userRole={user.role} userId={user.user_id} />;
      }
    }

    // Admin pages (placeholder - you can add AdminDashboard later)
    switch (currentPage) {
      case 'admin-dashboard':
      case 'dashboard':
        return (
          <div style={{ padding: '40px' }}>
            <h1 style={{ color: '#BDE8F5' }}>Admin Dashboard</h1>
            <p style={{ color: 'rgba(189,232,245,0.7)' }}>Welcome, {user.full_name}!</p>
            <p style={{ color: 'rgba(189,232,245,0.5)' }}>Admin features coming soon...</p>
          </div>
        );
      case 'devices':
        return <DeviceManagement userId={user.user_id} userName={user.full_name} />;
      case 'activity':
        return <ActivityLog userId={user.user_id} userName={user.full_name} />;
      default:
        return (
          <div style={{ padding: '40px' }}>
            <h1 style={{ color: '#BDE8F5' }}>Admin Dashboard</h1>
            <p style={{ color: 'rgba(189,232,245,0.7)' }}>Welcome, {user.full_name}!</p>
          </div>
        );
    }
  };

  return (
    <div style={{ display: 'flex' }}>
      <OperatorSidebar 
        currentPage={currentPage}
        userName={user.full_name}
        userRole={user.role}
        onNavigate={setCurrentPage}
        onLogout={handleLogout}
      />
      <main style={{ flex: 1, minHeight: '100vh', marginLeft: '240px' }}>
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
