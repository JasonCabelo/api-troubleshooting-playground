import { useApi } from '../context/ApiContext';

/**
 * PerformanceDashboard Component
 * 
 * Displays API performance metrics and monitoring data.
 * Features include:
 * - Total requests count
 * - Error rate percentage
 * - Average response time
 * - Per-endpoint performance breakdown
 * - Slow endpoint warnings
 * 
 * This component helps users identify performance issues and trends
 */
function PerformanceDashboard() {
  const { metrics, refreshMetrics } = useApi();
  
  const { endpoints = {}, summary = {} } = metrics;

  /**
   * Get status class for endpoint health
   * 
   * @param {number} avgTime - Average response time in ms
   * @returns {Object} Styling object for the status
   */
  const getEndpointStatus = (avgTime) => {
    if (avgTime < 500) return { color: '#10b981', label: 'Healthy', class: 'badge-success' };
    if (avgTime < 2000) return { color: '#f59e0b', label: 'Slow', class: 'badge-warning' };
    return { color: '#ef4444', label: 'Very Slow', class: 'badge-error' };
  };

  /**
   * Format bytes to human readable format
   * (Placeholder for future size metrics)
   */
  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  /**
   * Get endpoint entries sorted by response time
   */
  const sortedEndpoints = Object.entries(endpoints).sort((a, b) => 
    b[1].avgTime - a[1].avgTime
  );

  return (
    <div className="panel">
      <div className="panel-header">
        <h2 className="panel-title">📊 Performance Dashboard</h2>
        
        {/* Refresh button */}
        <button 
          className="btn btn-secondary btn-sm"
          onClick={refreshMetrics}
          title="Refresh metrics"
        >
          🔄 Refresh
        </button>
      </div>
      
      <div className="panel-body">
        {/* Summary Metrics */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '12px',
          marginBottom: '24px'
        }}>
          {/* Total Requests */}
          <div className="metric-card">
            <div className="metric-value">{formatNumber(summary.totalRequests || 0)}</div>
            <div className="metric-label">Total Requests</div>
          </div>
          
          {/* Error Rate */}
          <div className="metric-card">
            <div className="metric-value" style={{ 
              color: (summary.errorRate || 0) > 5 ? '#ef4444' : 
                     (summary.errorRate || 0) > 0 ? '#f59e0b' : '#10b981'
            }}>
              {(summary.errorRate || 0).toFixed(1)}%
            </div>
            <div className="metric-label">Error Rate</div>
          </div>
          
          {/* Average Response Time */}
          <div className="metric-card">
            <div className="metric-value" style={{ 
              color: (summary.averageResponseTime || 0) > 2000 ? '#ef4444' : 
                     (summary.averageResponseTime || 0) > 500 ? '#f59e0b' : '#10b981'
            }}>
              {summary.averageResponseTime || 0}ms
            </div>
            <div className="metric-label">Avg Response Time</div>
          </div>
        </div>

        {/* Endpoint Performance Table */}
        {sortedEndpoints.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📈</div>
            <p>No performance data yet</p>
            <p style={{ fontSize: '0.875rem', marginTop: '8px' }}>
              Make API requests to see performance metrics
            </p>
          </div>
        ) : (
          <>
            <h4 style={{ marginBottom: '12px' }}>Endpoint Performance</h4>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Endpoint</th>
                    <th>Requests</th>
                    <th>Avg Time</th>
                    <th>Min / Max</th>
                    <th>Errors</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedEndpoints.map(([endpoint, data]) => {
                    const status = getEndpointStatus(data.avgTime);
                    const errorRate = data.count > 0 ? (data.errors / data.count) * 100 : 0;
                    
                    return (
                      <tr key={endpoint}>
                        {/* Endpoint */}
                        <td style={{ 
                          fontFamily: 'monospace', 
                          fontSize: '0.8125rem',
                          maxWidth: '150px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }} title={endpoint}>
                          {endpoint}
                        </td>
                        
                        {/* Request Count */}
                        <td>{data.count}</td>
                        
                        {/* Average Time */}
                        <td style={{ 
                          fontWeight: 600,
                          color: status.color
                        }}>
                          {data.avgTime}ms
                        </td>
                        
                        {/* Min / Max Time */}
                        <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {data.minTime}ms / {data.maxTime}ms
                        </td>
                        
                        {/* Error Count */}
                        <td>
                          <span style={{ 
                            color: errorRate > 0 ? '#ef4444' : 'var(--text-secondary)',
                            fontWeight: errorRate > 0 ? 600 : 400
                          }}>
                            {data.errors} ({errorRate.toFixed(1)}%)
                          </span>
                        </td>
                        
                        {/* Status */}
                        <td>
                          <span className={`badge ${status.class}`}>
                            {status.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Performance Tips */}
            <div style={{ marginTop: '24px' }}>
              <h4 style={{ marginBottom: '12px' }}>💡 Performance Tips</h4>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '12px' 
              }}>
                {/* Fast Response Tip */}
                <div style={{ 
                  padding: '12px', 
                  background: '#ecfdf5', 
                  borderRadius: '8px',
                  border: '1px solid #a7f3d0'
                }}>
                  <div style={{ fontWeight: 600, color: '#065f46', marginBottom: '4px' }}>
                    ⚡ Fast APIs
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#047857' }}>
                    Response times under 500ms indicate healthy API performance
                  </div>
                </div>
                
                {/* Slow Response Tip */}
                <div style={{ 
                  padding: '12px', 
                  background: '#fffbeb', 
                  borderRadius: '8px',
                  border: '1px solid #fde68a'
                }}>
                  <div style={{ fontWeight: 600, color: '#92400e', marginBottom: '4px' }}>
                    🐢 Slow APIs
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#b45309' }}>
                    Response times over 2 seconds may indicate issues
                  </div>
                </div>
                
                {/* Error Rate Tip */}
                <div style={{ 
                  padding: '12px', 
                  background: '#fef2f2', 
                  borderRadius: '8px',
                  border: '1px solid #fecaca'
                }}>
                  <div style={{ fontWeight: 600, color: '#991b1b', marginBottom: '4px' }}>
                    ⚠️ Error Rates
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#b91c1c' }}>
                    Error rates above 5% require immediate attention
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default PerformanceDashboard;
