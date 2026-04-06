import { createRoot } from 'react-dom/client';
import App from './App';
import { testSupabaseConnection } from './lib/supabase';

// Test Supabase connection on startup
testSupabaseConnection().then((connected) => {
  if (connected) {
    console.log('🚀 App ready with live database connection');
  } else {
    console.log('📦 App running with mock data');
  }
});

const container = document.getElementById('root');
if (!container) {
  console.error('Root element not found');
} else {
  try {
    const root = createRoot(container);
    root.render(<App />);
    console.log('App rendered successfully');
  } catch (error) {
    console.error('Error rendering app:', error);
    container.innerHTML = `<div style="padding: 20px; color: red;">Error: ${error}</div>`;
  }
}