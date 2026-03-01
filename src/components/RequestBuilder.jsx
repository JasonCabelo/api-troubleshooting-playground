import { useState } from 'react';
import { useApi } from '../context/ApiContext';

/**
 * RequestBuilder Component
 * 
 * Provides a form for building and sending API requests.
 * This component allows users to:
 * - Enter the endpoint URL
 * - Select HTTP method (GET, POST, PUT, DELETE, PATCH)
 * - Add custom headers
 * - Add query parameters
 * - Add request body (for POST, PUT, PATCH)
 * - Send the request
 * 
 * The component integrates with the ApiContext for state management
 * and communicates with the backend proxy server to avoid CORS issues
 */
function RequestBuilder() {
  const { requestState, setRequestState, sendRequest, loading } = useApi();
  
  // Local state for managing headers array
  const [activeTab, setActiveTab] = useState('headers');
  
  /**
   * Update a specific header
   * 
   * @param {number} index - Index of the header to update
   * @param {string} field - Field to update ('key' or 'value')
   * @param {string} value - New value for the field
   */
  const updateHeader = (index, field, value) => {
    const newHeaders = [...requestState.headers];
    newHeaders[index] = { ...newHeaders[index], [field]: value };
    setRequestState({ headers: newHeaders });
  };

  /**
   * Add a new header row
   * Creates an empty header that users can fill in
   */
  const addHeader = () => {
    setRequestState({ 
      headers: [...requestState.headers, { key: '', value: '' }] 
    });
  };

  /**
   * Remove a header row
   * 
   * @param {number} index - Index of the header to remove
   */
  const removeHeader = (index) => {
    const newHeaders = requestState.headers.filter((_, i) => i !== index);
    setRequestState({ headers: newHeaders });
  };

  /**
   * Handle form submission
   * Triggers the API request through the context
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    sendRequest();
  };

  /**
   * Quick auth presets for common authentication methods
   * These help users quickly set up common auth patterns
   */
  const applyAuthPreset = (type) => {
    switch (type) {
      case 'bearer':
        setRequestState({
          headers: [
            ...requestState.headers.filter(h => h.key !== 'Authorization'),
            { key: 'Authorization', value: 'Bearer ' }
          ]
        });
        break;
      case 'apikey':
        setRequestState({
          headers: [
            ...requestState.headers.filter(h => h.key !== 'X-API-Key'),
            { key: 'X-API-Key', value: 'your-api-key-here' }
          ]
        });
        break;
      case 'basic':
        setRequestState({
          headers: [
            ...requestState.headers.filter(h => h.key !== 'Authorization'),
            { key: 'Authorization', value: 'Basic base64-encoded-credentials' }
          ]
        });
        break;
    }
  };

  // Check if request body should be shown (for non-GET methods)
  const showBody = ['POST', 'PUT', 'PATCH'].includes(requestState.method);

  return (
    <div className="panel">
      <div className="panel-header">
        <h2 className="panel-title">📡 API Request Builder</h2>
      </div>
      
      <div className="panel-body">
        <form onSubmit={handleSubmit}>
          {/* URL and Method Row */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            {/* HTTP Method Select */}
            <select
              className="form-select"
              value={requestState.method}
              onChange={(e) => setRequestState({ method: e.target.value })}
              style={{ width: '120px', flexShrink: 0 }}
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
              <option value="PATCH">PATCH</option>
            </select>
            
            {/* Endpoint URL Input */}
            <input
              type="text"
              className="form-input"
              placeholder="Enter API endpoint URL"
              value={requestState.url}
              onChange={(e) => setRequestState({ url: e.target.value })}
              required
            />
            
            {/* Send Button */}
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading || !requestState.url}
              style={{ flexShrink: 0, minWidth: '100px' }}
            >
              {loading ? (
                <>
                  <span className="loading-spinner" style={{ marginRight: '8px' }}></span>
                  Sending
                </>
              ) : (
                'Send Request'
              )}
            </button>
          </div>

          {/* Quick Auth Presets */}
          <div style={{ marginBottom: '16px' }}>
            <label className="form-label">Quick Auth Presets</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                type="button" 
                className="btn btn-secondary btn-sm"
                onClick={() => applyAuthPreset('bearer')}
              >
                Bearer Token
              </button>
              <button 
                type="button" 
                className="btn btn-secondary btn-sm"
                onClick={() => applyAuthPreset('apikey')}
              >
                API Key
              </button>
              <button 
                type="button" 
                className="btn btn-secondary btn-sm"
                onClick={() => applyAuthPreset('basic')}
              >
                Basic Auth
              </button>
            </div>
          </div>

          {/* Tabs for Headers, Params, Body */}
          <div className="tabs">
            <button 
              type="button"
              className={`tab ${activeTab === 'headers' ? 'active' : ''}`}
              onClick={() => setActiveTab('headers')}
            >
              Headers ({requestState.headers.filter(h => h.key).length})
            </button>
            <button 
              type="button"
              className={`tab ${activeTab === 'params' ? 'active' : ''}`}
              onClick={() => setActiveTab('params')}
            >
              Query Params
            </button>
            {showBody && (
              <button 
                type="button"
                className={`tab ${activeTab === 'body' ? 'active' : ''}`}
                onClick={() => setActiveTab('body')}
              >
                Request Body
              </button>
            )}
          </div>

          {/* Headers Tab */}
          {activeTab === 'headers' && (
            <div className="headers-editor">
              {requestState.headers.map((header, index) => (
                <div key={index} className="header-row">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Header name"
                    value={header.key}
                    onChange={(e) => updateHeader(index, 'key', e.target.value)}
                  />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Header value"
                    value={header.value}
                    onChange={(e) => updateHeader(index, 'value', e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn-remove"
                    onClick={() => removeHeader(index)}
                    title="Remove header"
                  >
                    ×
                  </button>
                </div>
              ))}
              <div style={{ padding: '8px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm"
                  onClick={addHeader}
                >
                  + Add Header
                </button>
              </div>
            </div>
          )}

          {/* Query Params Tab */}
          {activeTab === 'params' && (
            <div className="form-group">
              <textarea
                className="form-textarea"
                placeholder='{"key": "value"} or key=value&key2=value2'
                value={requestState.params}
                onChange={(e) => setRequestState({ params: e.target.value })}
                rows={4}
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Enter as JSON object or URL-encoded key=value pairs
              </p>
            </div>
          )}

          {/* Request Body Tab */}
          {activeTab === 'body' && (
            <div className="form-group">
              <textarea
                className="form-textarea"
                placeholder='{"key": "value"}'
                value={requestState.body}
                onChange={(e) => setRequestState({ body: e.target.value })}
                rows={8}
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Enter JSON body for POST, PUT, or PATCH requests
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default RequestBuilder;
