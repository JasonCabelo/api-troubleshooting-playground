import { useState } from 'react';
import { useApi } from '../context/ApiContext';

/**
 * ResponseViewer Component
 * 
 * Displays the API response in a formatted, easy-to-read manner.
 * Features include:
 * - JSON syntax highlighting
 * - Raw response mode
 * - Header inspection
 * - Response timing metrics
 * 
 * This component shows the results of API requests made through
 * the RequestBuilder component
 */
function ResponseViewer() {
  const { response, loading, error } = useApi();
  
  // Local state for view mode (formatted vs raw)
  const [viewMode, setViewMode] = useState('formatted');
  
  // Local state for active tab (body vs headers)
  const [activeTab, setActiveTab] = useState('body');

  /**
   * Get status code class for styling
   * 
   * @param {number} status - HTTP status code
   * @returns {string} CSS class for the status code
   */
  const getStatusClass = (status) => {
    if (status >= 200 && status < 300) return 'status-2xx';
    if (status >= 300 && status < 400) return 'status-3xx';
    if (status >= 400 && status < 500) return 'status-4xx';
    if (status >= 500) return 'status-5xx';
    return 'status-0';
  };

  /**
   * Get response time class for styling
   * 
   * @param {number} time - Response time in milliseconds
   * @returns {string} CSS class for the response time
   */
  const getResponseTimeClass = (time) => {
    if (time < 500) return 'fast';
    if (time < 2000) return 'slow';
    return 'very-slow';
  };

  /**
   * Format JSON with syntax highlighting
   * 
   * @param {any} data - Data to format
   * @returns {string} Formatted JSON string
   */
  const formatJson = (data) => {
    try {
      if (typeof data === 'string') {
        return JSON.stringify(JSON.parse(data), null, 2);
      }
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  /**
   * Simple JSON syntax highlighter
   * Adds color classes to JSON tokens for better readability
   * 
   * @param {string} json - JSON string to highlight
   * @returns {JSX.Element} React element with highlighted JSON
   */
  const highlightJson = (json) => {
    if (!json) return null;
    
    // Simple regex-based highlighting
    const highlighted = json
      .replace(/"([^"]+)":/g, '<span class="key">"$1"</span>:') // Keys
      .replace(/: "([^"]*)"/g, ': <span class="string">"$1"</span>') // String values
      .replace(/: (\d+\.?\d*)/g, ': <span class="number">$1</span>') // Numbers
      .replace(/: (true|false)/g, ': <span class="boolean">$1</span>') // Booleans
      .replace(/: (null)/g, ': <span class="null">$1</span>'); // Null

    return <pre dangerouslySetInnerHTML={{ __html: highlighted }} />;
  };

  // Loading state
  if (loading) {
    return (
      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">📄 Response Viewer</h2>
        </div>
        <div className="panel-body">
          <div className="empty-state">
            <div className="loading-spinner" style={{ width: '40px', height: '40px' }}></div>
            <p style={{ marginTop: '16px' }}>Sending request...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">📄 Response Viewer</h2>
        </div>
        <div className="panel-body">
          <div className="error-analysis">
            <h4>❌ Request Failed</h4>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // No response yet state
  if (!response) {
    return (
      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">📄 Response Viewer</h2>
        </div>
        <div className="panel-body">
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <p>No response yet</p>
            <p style={{ fontSize: '0.875rem', marginTop: '8px' }}>
              Send a request to see the response here
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <h2 className="panel-title">📄 Response Viewer</h2>
        
        {/* Response Metadata Badges */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Status Code Badge */}
          <span className={`badge ${response.statusCode >= 200 && response.statusCode < 300 ? 'badge-success' : 
            response.statusCode >= 400 ? 'badge-error' : 'badge-warning'}`}>
            <span className={`status-code ${getStatusClass(response.statusCode)}`}>
              {response.statusCode} {response.statusText}
            </span>
          </span>
          
          {/* Response Time Badge */}
          <span className={`response-time ${getResponseTimeClass(response.responseTime)}`}>
            ⏱️ {response.responseTime}ms
          </span>
        </div>
      </div>
      
      <div className="panel-body">
        {/* View Mode Toggle */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div className="tabs" style={{ marginBottom: 0, borderBottom: 'none' }}>
            <button 
              className={`tab ${activeTab === 'body' ? 'active' : ''}`}
              onClick={() => setActiveTab('body')}
            >
              Body
            </button>
            <button 
              className={`tab ${activeTab === 'headers' ? 'active' : ''}`}
              onClick={() => setActiveTab('headers')}
            >
              Headers
            </button>
          </div>
          
          {/* Format/Raw Toggle */}
          {activeTab === 'body' && (
            <div>
              <button 
                className={`btn btn-sm ${viewMode === 'formatted' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setViewMode('formatted')}
              >
                Formatted
              </button>
              <button 
                className={`btn btn-sm ${viewMode === 'raw' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setViewMode('raw')}
                style={{ marginLeft: '4px' }}
              >
                Raw
              </button>
            </div>
          )}
        </div>

        {/* Body Tab Content */}
        {activeTab === 'body' && (
          <div className="json-viewer">
            {viewMode === 'formatted' ? (
              highlightJson(formatJson(response.data))
            ) : (
              <pre>{typeof response.data === 'string' ? response.data : JSON.stringify(response.data)}</pre>
            )}
          </div>
        )}

        {/* Headers Tab Content */}
        {activeTab === 'headers' && (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Header Name</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {response.headers && Object.entries(response.headers).map(([key, value]) => (
                  <tr key={key}>
                    <td style={{ fontWeight: 500 }}>{key}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default ResponseViewer;
