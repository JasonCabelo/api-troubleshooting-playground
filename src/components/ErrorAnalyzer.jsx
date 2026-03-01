import { useApi } from '../context/ApiContext';

/**
 * ErrorAnalyzer Component
 * 
 * Automatically identifies common API errors and provides diagnostic hints.
 * This component helps API support engineers quickly diagnose issues
 * by showing:
 * - Error title and description
 * - Possible causes
 * - Suggested solutions
 * 
 * The analysis is triggered automatically when an error response is received
 */
function ErrorAnalyzer() {
  const { response, error, errorAnalysis } = useApi();

  /**
   * Determine if we should show error analysis
   * Shows when there's an error response OR a request error
   */
  const shouldShowAnalysis = () => {
    if (!response && !error) return false;
    
    // Show if we have an error status code (4xx or 5xx)
    if (response && response.statusCode >= 400) return true;
    
    // Show if we have a request error
    if (error) return true;
    
    // Show if we have error analysis data
    if (errorAnalysis) return true;
    
    return false;
  };

  /**
   * Get the error status code to display
   */
  const getStatusCode = () => {
    if (response && response.statusCode >= 400) {
      return response.statusCode;
    }
    return 0;
  };

  /**
   * Get the error message to display
   */
  const getErrorMessage = () => {
    if (error) return error;
    if (response && response.statusCode >= 400) {
      return response.data?.error || `HTTP Error ${response.statusCode}`;
    }
    return null;
  };

  // Don't show if there's no error
  if (!shouldShowAnalysis()) {
    return (
      <div className="panel panel-full">
        <div className="panel-header">
          <h2 className="panel-title">🔍 Error Analyzer</h2>
        </div>
        <div className="panel-body">
          <div className="empty-state">
            <div className="empty-state-icon">✅</div>
            <p>No errors detected</p>
            <p style={{ fontSize: '0.875rem', marginTop: '8px' }}>
              Error analysis will appear here when API errors are detected
            </p>
          </div>
        </div>
      </div>
    );
  }

  const statusCode = getStatusCode();
  const errorMessage = getErrorMessage();

  return (
    <div className="panel panel-full">
      <div className="panel-header">
        <h2 className="panel-title">🔍 Error Analyzer</h2>
        
        {/* Status badge */}
        {statusCode > 0 && (
          <span className={`badge ${statusCode >= 500 ? 'badge-error' : 'badge-warning'}`}>
            <span className={`status-code status-${Math.floor(statusCode / 100)}xx`}>
              HTTP {statusCode}
            </span>
          </span>
        )}
        {statusCode === 0 && (
          <span className="badge badge-error">
            <span className="status-code status-0">Request Failed</span>
          </span>
        )}
      </div>
      
      <div className="panel-body">
        {/* Error Message */}
        {errorMessage && (
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ marginBottom: '8px', color: 'var(--text-primary)' }}>
              Error Message:
            </h4>
            <p style={{ 
              color: 'var(--error-color)', 
              fontFamily: 'monospace',
              background: '#fef2f2',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #fecaca'
            }}>
              {errorMessage}
            </p>
          </div>
        )}

        {/* Error Analysis from API */}
        {errorAnalysis && (
          <div className="error-analysis">
            <h4>📋 {errorAnalysis.title || 'Error Analysis'}</h4>
            
            {/* Possible Causes */}
            {errorAnalysis.causes && errorAnalysis.causes.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <h5 style={{ color: '#991b1b', marginBottom: '8px' }}>
                  🔴 Possible Causes:
                </h5>
                <ul>
                  {errorAnalysis.causes.map((cause, index) => (
                    <li key={index}>{cause}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Suggested Solutions */}
            {errorAnalysis.solutions && errorAnalysis.solutions.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <h5 style={{ color: '#065f46', marginBottom: '8px' }}>
                  🟢 Suggested Solutions:
                </h5>
                <ul>
                  {errorAnalysis.solutions.map((solution, index) => (
                    <li key={index} style={{ color: '#064e3b' }}>{solution}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Generic fallback if no analysis available */}
        {!errorAnalysis && (
          <div className="error-analysis">
            <h4>⚠️ Error Detected</h4>
            <p style={{ marginTop: '8px', color: '#7f1d1d' }}>
              {statusCode === 0 
                ? 'The request failed to complete. This could be due to network issues, server unavailability, or invalid URL.'
                : `Received HTTP ${statusCode} status code. Check the API documentation for details.`
              }
            </p>
            <div style={{ marginTop: '16px' }}>
              <h5 style={{ color: '#065f46', marginBottom: '8px' }}>
                🟢 Troubleshooting Steps:
              </h5>
              <ul>
                <li>Verify the endpoint URL is correct</li>
                <li>Check authentication credentials</li>
                <li>Review request headers and body format</li>
                <li>Try the request with a different tool (curl, Postman)</li>
                <li>Check if the API service is currently available</li>
              </ul>
            </div>
          </div>
        )}

        {/* Quick Reference for Common Errors */}
        <div style={{ marginTop: '20px' }}>
          <h4 style={{ marginBottom: '12px' }}>📚 Common HTTP Status Codes</h4>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '8px'
          }}>
            <div className="metric-card" style={{ padding: '12px' }}>
              <div style={{ fontWeight: '600', color: 'var(--warning-color)' }}>400</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Bad Request</div>
            </div>
            <div className="metric-card" style={{ padding: '12px' }}>
              <div style={{ fontWeight: '600', color: 'var(--warning-color)' }}>401</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Unauthorized</div>
            </div>
            <div className="metric-card" style={{ padding: '12px' }}>
              <div style={{ fontWeight: '600', color: 'var(--warning-color)' }}>403</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Forbidden</div>
            </div>
            <div className="metric-card" style={{ padding: '12px' }}>
              <div style={{ fontWeight: '600', color: 'var(--warning-color)' }}>404</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Not Found</div>
            </div>
            <div className="metric-card" style={{ padding: '12px' }}>
              <div style={{ fontWeight: '600', color: 'var(--error-color)' }}>500</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Server Error</div>
            </div>
            <div className="metric-card" style={{ padding: '12px' }}>
              <div style={{ fontWeight: '600', color: 'var(--error-color)' }}>503</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Unavailable</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ErrorAnalyzer;
