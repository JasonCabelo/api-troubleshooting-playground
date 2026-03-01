import { useEffect } from 'react';
import { ApiProvider, useApi } from './context/ApiContext';
import RequestBuilder from './components/RequestBuilder';
import ResponseViewer from './components/ResponseViewer';
import ErrorAnalyzer from './components/ErrorAnalyzer';
import LogViewer from './components/LogViewer';
import PerformanceDashboard from './components/PerformanceDashboard';

/**
 * Main Dashboard Component
 * 
 * This is the main dashboard view that organizes all the API troubleshooting
 * tools into a cohesive layout. It uses a grid system to display:
 * - Request Builder (top left) - For creating API requests
 * - Response Viewer (top right) - For viewing responses
 * - Error Analyzer (middle) - For diagnosing errors
 * - Log Viewer (bottom left) - For viewing request history
 * - Performance Dashboard (bottom right) - For monitoring metrics
 * 
 * The component uses the ApiContext to access shared state and actions
 */
function Dashboard() {
  const { initialize } = useApi();

  /**
   * Initialize the dashboard on mount
   * 
   * Fetches existing logs and metrics from the server to display
   * any historical data that might exist from previous sessions
   */
  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <div className="dashboard-grid">
      {/* Request Builder Panel - Create and send API requests */}
      <RequestBuilder />
      
      {/* Response Viewer Panel - Display API responses */}
      <ResponseViewer />
      
      {/* Error Analyzer Panel - Show error diagnostics */}
      <ErrorAnalyzer />
      
      {/* Log Viewer Panel - Display request history */}
      <LogViewer />
      
      {/* Performance Dashboard Panel - Show metrics */}
      <PerformanceDashboard />
    </div>
  );
}

/**
 * App Component
 * 
 * The root component that wraps the application with the ApiProvider.
 * This makes the API context available to all child components.
 * 
 * The ApiProvider manages:
 * - Request/response state
 * - API logs
 * - Performance metrics
 * - Error analysis data
 * 
 * @returns {JSX.Element} The main application layout
 */
function App() {
  return (
    <ApiProvider>
      <div className="app-container">
        {/* Application Header */}
        <header className="app-header">
          <h1>🔧 API Troubleshooting Playground</h1>
          <p>
            Test, debug, and monitor API endpoints like a professional support engineer
          </p>
        </header>

        {/* Main Dashboard */}
        <Dashboard />
        
        {/* Footer */}
        <footer style={{ 
          textAlign: 'center', 
          marginTop: '24px', 
          padding: '16px',
          color: 'var(--text-secondary)',
          fontSize: '0.875rem'
        }}>
          API Troubleshooting Playground
        </footer>
      </div>
    </ApiProvider>
  );
}

export default App;
