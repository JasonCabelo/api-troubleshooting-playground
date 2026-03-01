import { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';

// Create the API Context - provides global state for API requests, logs, and metrics
const ApiContext = createContext(null);

/**
 * API Provider Component
 * 
 * Manages global state for the API Troubleshooting Playground including:
 * - Current API request/response data
 * - Request logs history
 * - Performance metrics
 * - Loading states
 * 
 * This context is used throughout the application to share data between components
 */
export function ApiProvider({ children }) {
  // Current request state
  const [requestState, setRequestState] = useState({
    url: 'https://jsonplaceholder.typicode.com/posts/1',
    method: 'GET',
    headers: [{ key: 'Content-Type', value: 'application/json' }],
    body: '',
    params: ''
  });

  // Current response state
  const [response, setResponse] = useState(null);
  
  // Loading state for API requests
  const [loading, setLoading] = useState(false);
  
  // Error state for failed requests
  const [error, setError] = useState(null);
  
  // API logs history
  const [logs, setLogs] = useState([]);
  
  // Performance metrics
  const [metrics, setMetrics] = useState({ endpoints: {}, summary: {} });
  
  // Error analysis result
  const [errorAnalysis, setErrorAnalysis] = useState(null);

  /**
   * Send API Request
   * 
   * Sends a request through the proxy server to avoid CORS issues
   * Updates response state and refreshes logs/metrics after completion
   * 
   * @param {Object} customRequest - Optional custom request configuration
   */
  const sendRequest = useCallback(async (customRequest = null) => {
    const request = customRequest || requestState;
    
    setLoading(true);
    setError(null);
    setResponse(null);
    setErrorAnalysis(null);

    try {
      // Parse headers from array format to object
      const headersObj = {};
      request.headers.forEach(h => {
        if (h.key && h.value) {
          headersObj[h.key] = h.value;
        }
      });

      // Parse query parameters
      let params = {};
      if (request.params) {
        try {
          params = JSON.parse(request.params);
        } catch {
          // If not valid JSON, treat as key=value pairs
          const paramPairs = request.params.split('&');
          paramPairs.forEach(pair => {
            const [key, value] = pair.split('=');
            if (key) params[key] = value || '';
          });
        }
      }

      // Parse request body for non-GET requests
      let body = null;
      if (request.method !== 'GET' && request.body) {
        try {
          body = JSON.parse(request.body);
        } catch {
          body = request.body;
        }
      }

      // Make the API request through the proxy server
      const res = await axios.post('http://localhost:3001/api/proxy', {
        url: request.url,
        method: request.method,
        headers: headersObj,
        body,
        params
      });

      setResponse(res.data);

      // Analyze error if status code indicates an error
      if (res.data.statusCode >= 400 || res.data.statusCode === 0) {
        await analyzeError(res.data.statusCode || 0);
      }

      // Refresh logs and metrics
      await refreshLogs();
      await refreshMetrics();

    } catch (err) {
      // Handle request errors
      setError(err.response?.data?.error || err.message || 'Request failed');
      
      // Try to analyze the error if we have status code
      if (err.response?.status) {
        await analyzeError(err.response.status);
      }
      
      // Refresh logs even on error to capture the failed request
      await refreshLogs();
      await refreshMetrics();
    } finally {
      setLoading(false);
    }
  }, [requestState]);

  /**
   * Refresh Logs
   * 
   * Fetches the latest API request logs from the server
   * This is called after each request to keep the log viewer up to date
   */
  const refreshLogs = async () => {
    try {
      const res = await axios.get('http://localhost:3001/api/logs');
      setLogs(res.data);
    } catch (err) {
      console.error('Failed to refresh logs:', err);
    }
  };

  /**
   * Refresh Metrics
   * 
   * Fetches the latest performance metrics from the server
   * Updates the performance dashboard with new data
   */
  const refreshMetrics = async () => {
    try {
      const res = await axios.get('http://localhost:3001/api/metrics');
      setMetrics(res.data);
    } catch (err) {
      console.error('Failed to refresh metrics:', err);
    }
  };

  /**
   * Analyze Error
   * 
   * Fetches diagnostic information for a given HTTP status code
   * Helps users understand what might be causing the API error
   * 
   * @param {number} statusCode - HTTP status code to analyze
   */
  const analyzeError = async (statusCode) => {
    try {
      const res = await axios.get(`http://localhost:3001/api/analyze/${statusCode}`);
      setErrorAnalysis(res.data);
    } catch (err) {
      console.error('Failed to analyze error:', err);
    }
  };

  /**
   * Clear Logs
   * 
   * Deletes all stored API request logs
   * Useful for testing and resetting the playground
   */
  const clearLogs = async () => {
    try {
      await axios.delete('http://localhost:3001/api/logs');
      setLogs([]);
      setMetrics({ endpoints: {}, summary: {} });
    } catch (err) {
      console.error('Failed to clear logs:', err);
    }
  };

  /**
   * Update Request State
   * 
   * Updates the current request configuration
   * This is called when users modify the request builder form
   * 
   * @param {Object} updates - Object containing fields to update
   */
  const updateRequestState = useCallback((updates) => {
    setRequestState(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * Initialize - fetch initial data
   * 
   * Loads logs and metrics when the app first loads
   * Ensures the dashboard shows historical data if any exists
   */
  const initialize = useCallback(async () => {
    await Promise.all([refreshLogs(), refreshMetrics()]);
  }, []);

  // Value object provided to consumers
  const value = {
    // Request state
    requestState,
    setRequestState: updateRequestState,
    
    // Response state
    response,
    loading,
    error,
    
    // Logs and metrics
    logs,
    metrics,
    errorAnalysis,
    
    // Actions
    sendRequest,
    refreshLogs,
    refreshMetrics,
    analyzeError,
    clearLogs,
    initialize
  };

  return (
    <ApiContext.Provider value={value}>
      {children}
    </ApiContext.Provider>
  );
}

/**
 * Custom hook to access the API Context
 * 
 * @returns {Object} The API context value containing state and actions
 * @throws {Error} If used outside of an ApiProvider
 * 
 * @example
 * const { response, loading, sendRequest } = useApi();
 */
export function useApi() {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
}

export default ApiContext;
