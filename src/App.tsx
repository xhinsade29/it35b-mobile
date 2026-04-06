import { useState } from 'react';
import OperatorSidebar from './OperatorSidebar';
import Dashboard from './Dashboard';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('operator-dashboard');
  const [userName] = useState('Operator');
  const [userRole] = useState('operator');

  const renderContent = () => {
    switch (currentPage) {
      case 'operator-dashboard':
        return <Dashboard userName={userName} userRole={userRole} userId={1} />;
      case 'devices':
        return (
          <div style={{ marginLeft: '240px', padding: '40px' }}>
            <h1>Devices Page</h1>
            <p>Device management interface coming soon...</p>
          </div>
        );
      case 'activity':
        return (
          <div style={{ marginLeft: '240px', padding: '40px' }}>
            <h1>My Activity</h1>
            <p>Activity history coming soon...</p>
          </div>
        );
      default:
        return <Dashboard userName={userName} userRole={userRole} />;
    }
  };

  return (
    <div style={{ display: 'flex' }}>
      <OperatorSidebar 
        currentPage={currentPage}
        userName={userName}
        userRole={userRole}
        onNavigate={setCurrentPage}
      />
      <main style={{ flex: 1, minHeight: '100vh', marginLeft: '240px' }}>
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
