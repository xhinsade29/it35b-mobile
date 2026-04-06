import OperatorSidebar from './OperatorSidebar';

const App: React.FC = () => {
  return (
    <div style={{ display: 'flex' }}>
      <OperatorSidebar 
        currentPage="operator-dashboard"
        userName="Operator"
        userRole="operator"
      />
      <main style={{ marginLeft: '240px', padding: '20px', flex: 1 }}>
        <h1>Dashboard Content</h1>
        <p>Your main content goes here.</p>
      </main>
    </div>
  );
};

export default App;
