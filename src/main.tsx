import { createRoot } from 'react-dom/client';
import App from './App';

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