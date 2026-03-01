import { useState } from 'react';
import { useApi } from '../context/ApiContext';
import { format } from 'date-fns';

/**
 * LogViewer Component
 * 
 * Displays a history of all API requests made through the playground.
 * Features include:
 * - Timestamp display
 * - Endpoint and method
 * - Status code with color coding
 * - Response time
 * - Filtering by status code, endpoint, and time range
 * 
 * This component helps users track and analyze their API testing history
 */
function LogViewer() {
  const { logs, refreshLogs, clearLogs } = useApi();
  
  // Filter state
  const [statusFilter, setStatusFilter] = useState('');
  const [endpointFilter, setEndpointFilter] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  /**
   * Get status code class for styling
   * 
   * @param {number} status - HTTP status code
   * @returns {string} CSS class for the status code
   */
  const getStatusClass = (status) => {
    if (status === 0) return 'status-0';
    if (status >= 200 && status < 300) return 'status-2xx';
    if (status >= 300 && status < 400) return 'status-3xx';
    if (status >= 400 && status < 500) return 'status-4xx';
    if (status >= 500) return 'status-5xx';
    return '';
  };

  /**
   * Filter logs based on current filter state
   */
  const filteredLogs = logs.filter(log => {
    if (statusFilter && log.statusCode !== parseInt(statusFilter)) return false;
    if (endpointFilter && !log.endpoint.toLowerCase().includes(endpointFilter.toLowerCase())) return false;
    return true;
  });

  /**
   * Get paginated logs
   */
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  /**
   * Calculate total pages
   */
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

  /**
   * Reset filters
   */
  const resetFilters = () => {
    setStatusFilter('');
    setEndpointFilter('');
    setCurrentPage(1);
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <h2 className="panel-title">📋 API Log Viewer</h2>
        
        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={refreshLogs}
            title="Refresh logs"
          >
            🔄 Refresh
          </button>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={clearLogs}
            title="Clear all logs"
          >
            🗑️ Clear
          </button>
        </div>
      </div>
      
      <div className="panel-body">
        {/* Filter Bar */}
        <div className="filter-bar">
          <input
            type="text"
            className="form-input"
            placeholder="Filter by endpoint..."
            value={endpointFilter}
            onChange={(e) => {
              setEndpointFilter(e.target.value);
              setCurrentPage(1);
            }}
          />
          
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">All Status Codes</option>
            <option value="200">200 OK</option>
            <option value="201">201 Created</option>
            <option value="204">204 No Content</option>
            <option value="400">400 Bad Request</option>
            <option value="401">401 Unauthorized</option>
            <option value="403">403 Forbidden</option>
            <option value="404">404 Not Found</option>
            <option value="500">500 Server Error</option>
          </select>
          
          {(statusFilter || endpointFilter) && (
            <button 
              className="btn btn-secondary btn-sm"
              onClick={resetFilters}
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Logs Table */}
        {logs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <p>No logs yet</p>
            <p style={{ fontSize: '0.875rem', marginTop: '8px' }}>
              Make API requests to see them logged here
            </p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Method</th>
                    <th>Endpoint</th>
                    <th>Status</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLogs.map((log) => (
                    <tr key={log.id}>
                      {/* Timestamp */}
                      <td style={{ whiteSpace: 'nowrap', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {format(new Date(log.timestamp), 'HH:mm:ss')}
                      </td>
                      
                      {/* HTTP Method */}
                      <td>
                        <span className={`badge ${
                          log.method === 'GET' ? 'badge-info' :
                          log.method === 'POST' ? 'badge-success' :
                          log.method === 'PUT' ? 'badge-warning' :
                          log.method === 'DELETE' ? 'badge-error' :
                          'badge-info'
                        }`}>
                          {log.method}
                        </span>
                      </td>
                      
                      {/* Endpoint */}
                      <td style={{ 
                        maxWidth: '200px', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontFamily: 'monospace',
                        fontSize: '0.8125rem'
                      }} title={log.endpoint}>
                        {log.endpoint}
                      </td>
                      
                      {/* Status Code */}
                      <td>
                        <span className={`status-code ${getStatusClass(log.statusCode)}`}>
                          {log.statusCode || 'Error'}
                        </span>
                      </td>
                      
                      {/* Response Time */}
                      <td style={{ 
                        color: log.responseTime < 500 ? 'var(--success-color)' :
                               log.responseTime < 2000 ? 'var(--warning-color)' :
                               'var(--error-color)'
                      }}>
                        {log.responseTime}ms
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginTop: '16px'
              }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredLogs.length)} of {filteredLogs.length} logs
                </span>
                
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  
                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        className={`btn btn-sm ${currentPage === pageNum ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default LogViewer;
