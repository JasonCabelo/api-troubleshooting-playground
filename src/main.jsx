import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

/**
 * Main entry point for the API Troubleshooting Playground React application
 * 
 * This application simulates the workflow of API support engineers by providing:
 * - API Request Builder for testing endpoints
 * - Response Viewer with syntax highlighting
 * - Error Analyzer for diagnosing issues
 * - Log Viewer for tracking API calls
 * - Performance Dashboard for monitoring
 * 
 * The app uses React Context for global state management
 * and communicates with a Node.js/Express backend for proxying requests
 */
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
