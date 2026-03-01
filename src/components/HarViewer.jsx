import { useState, useRef } from 'react';
import axios from 'axios';

/**
 * HarViewer Component
 * 
 * Allows uploading and viewing HAR (HTTP Archive) files.
 * HAR files capture browser network requests and can be used
 * to analyze and replay API calls captured from browsers.
 * 
 * Features:
 * - Upload HAR file
 * - Parse and display request entries
 * - Show request URLs, methods, status codes, headers
 * - Display timing breakdown
 */
function HarViewer() {
  const [harData, setHarData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const fileInputRef = useRef(null);

  /**
   * Handle file upload
   * 
   * @param {Event} e - File input change event
   */
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setHarData(null);
    setSelectedEntry(null);

    try {
      // Read the file content
      const content = await file.text();
      const parsedHar = JSON.parse(content);

      // Send to backend for analysis
      const response = await axios.post('http://localhost:3001/api/har', {
        harData: parsedHar
      });

      setHarData(response.data);
    } catch (err) {
      setError(err.message || 'Failed to parse HAR file');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Trigger file input click
   */
  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  /**
   * Format milliseconds to human readable
   */
  const formatTime = (ms) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  /**
   * Get status class for styling
   */
  const getStatusClass = (status) => {
    if (status >= 200 && status < 300) return 'status-2xx';
    if (status >= 400 && status < 500) return 'status-4xx';
    if (status >= 500) return 'status-5xx';
    return '';
  };

  return (
    <div className="panel panel-full">
      <div className="panel-header">
        <h2 className="panel-title">📂 HAR File Viewer</h2>
      </div>
      
      <div className="panel-body">
        {/* File Upload */}
        <div style={{ marginBottom: '24px' }}>
          <input
            type="file"
            ref={fileInputRef}
            accept=".har,.json"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          
          <button 
            className="btn btn-primary"
            onClick={triggerFileUpload}
          >
            📁 Upload HAR File
          </button>
          
          <p style={{ 
            marginTop: '12px', 
            fontSize: '0.875rem', 
            color: 'var(--text-secondary)' 
          }}>
            Upload a HAR (HTTP Archive) file to analyze browser network requests
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="empty-state">
            <div className="loading-spinner" style={{ width: '40px', height: '40px' }}></div>
            <p style={{ marginTop: '16px' }}>Parsing HAR file...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="error-analysis">
            <h4>❌ Error</h4>
            <p>{error}</p>
          </div>
        )}

        {/* HAR Data Display */}
        {harData && (
          <>
            {/* Summary */}
            <div style={{ 
              display: 'flex', 
              gap: '24px', 
              marginBottom: '24px',
              padding: '16px',
              background: 'var(--bg-tertiary)',
              borderRadius: '8px'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Page Title</div>
                <div style={{ fontWeight: 500 }}>{harData.pageTitle || 'N/A'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Browser</div>
                <div style={{ fontWeight: 500 }}>{harData.browser || 'N/A'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>HAR Version</div>
                <div style={{ fontWeight: 500 }}>{harData.version || 'N/A'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Entries</div>
                <div style={{ fontWeight: 500 }}>{harData.entries?.length || 0}</div>
              </div>
            </div>

            {/* Entries Table */}
            <h4 style={{ marginBottom: '12px' }}>Network Requests</h4>
            <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Method</th>
                    <th>URL</th>
                    <th>Status</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {harData.entries?.map((entry, index) => (
                    <tr 
                      key={index}
                      onClick={() => setSelectedEntry(selectedEntry === index ? null : index)}
                      style={{ 
                        cursor: 'pointer',
                        background: selectedEntry === index ? 'var(--bg-tertiary)' : 'transparent'
                      }}
                    >
                      <td>{index + 1}</td>
                      <td>
                        <span className={`badge badge-${entry.method === 'GET' ? 'info' : 
                          entry.method === 'POST' ? 'success' : 'warning'}`}>
                          {entry.method}
                        </span>
                      </td>
                      <td style={{ 
                        maxWidth: '300px', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontSize: '0.8125rem'
                      }} title={entry.url}>
                        {entry.url}
                      </td>
                      <td>
                        <span className={`status-code ${getStatusClass(entry.status)}`}>
                          {entry.status} {entry.statusText}
                        </span>
                      </td>
                      <td>{formatTime(entry.time)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Selected Entry Details */}
            {selectedEntry !== null && harData.entries[selectedEntry] && (
              <div style={{ marginTop: '24px' }}>
                <h4 style={{ marginBottom: '12px' }}>
                  Request Details #{selectedEntry + 1}
                </h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {/* Request Headers */}
                  <div style={{ 
                    padding: '16px', 
                    background: 'var(--bg-tertiary)', 
                    borderRadius: '8px' 
                  }}>
                    <h5 style={{ marginBottom: '8px' }}>Request Headers</h5>
                    <div style={{ fontSize: '0.8125rem', fontFamily: 'monospace' }}>
                      {harData.entries[selectedEntry].requestHeaders?.map((header, i) => (
                        <div key={i} style={{ marginBottom: '4px' }}>
                          <span style={{ color: 'var(--primary-color)' }}>{header.name}</span>: {header.value}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Response Headers */}
                  <div style={{ 
                    padding: '16px', 
                    background: 'var(--bg-tertiary)', 
                    borderRadius: '8px' 
                  }}>
                    <h5 style={{ marginBottom: '8px' }}>Response Headers</h5>
                    <div style={{ fontSize: '0.8125rem', fontFamily: 'monospace' }}>
                      {harData.entries[selectedEntry].responseHeaders?.map((header, i) => (
                        <div key={i} style={{ marginBottom: '4px' }}>
                          <span style={{ color: 'var(--success-color)' }}>{header.name}</span>: {header.value}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Timing Breakdown */}
                  <div style={{ 
                    padding: '16px', 
                    background: 'var(--bg-tertiary)', 
                    borderRadius: '8px',
                    gridColumn: '1 / -1'
                  }}>
                    <h5 style={{ marginBottom: '8px' }}>Timing Breakdown</h5>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                      gap: '12px'
                    }}>
                      {Object.entries(harData.entries[selectedEntry].timings || {}).map(([key, value]) => (
                        <div key={key} style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                            {key.replace(/[-_]/g, ' ')}
                          </div>
                          <div style={{ fontWeight: 500, color: value > 0 ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                            {formatTime(Math.max(0, value))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!harData && !loading && !error && (
          <div className="empty-state">
            <div className="empty-state-icon">📂</div>
            <p>No HAR file loaded</p>
            <p style={{ fontSize: '0.875rem', marginTop: '8px' }}>
              Upload a HAR file to analyze browser network requests
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default HarViewer;
