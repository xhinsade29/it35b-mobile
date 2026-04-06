import { useState } from 'react';
import OperatorSidebar from './OperatorSidebar';
import Dashboard from './Dashboard';
import DeviceManagement from './DeviceManagement';
import ActivityLog from './ActivityLog';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('operator-dashboard');
  const [userName] = useState('Operator');
  const [userRole] = useState('operator');

  const renderContent = () => {
    switch (currentPage) {
      case 'operator-dashboard':
        return <Dashboard userName={userName} userRole={userRole} userId="00000000-0000-0000-0000-000000000001" />;
      case 'devices':
        return <DeviceManagement userId="00000000-0000-0000-0000-000000000001" userName={userName} />;
      case 'activity':
        return <ActivityLog userId="00000000-0000-0000-0000-000000000001" userName={userName} />;
      default:
        return <Dashboard userName={userName} userRole={userRole} userId="00000000-0000-0000-0000-000000000001" />;
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
