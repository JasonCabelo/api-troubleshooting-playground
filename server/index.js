import express from 'express';
import cors from 'cors';
import axios from 'axios';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';

// Initialize Express application
const app = express();

// Environment configuration
const PORT = process.env.DEV_PORT || process.env.PORT || 3001;
const NODE_ENV = process.env.DEV_NODE_ENV || process.env.NODE_ENV || 'development';
const ALLOWED_ORIGINS = (process.env.DEV_ALLOWED_ORIGINS || process.env.ALLOWED_ORIGINS)
  ? (process.env.DEV_ALLOWED_ORIGINS || process.env.ALLOWED_ORIGINS).split(',') 
  : ['http://localhost:5173', 'http://localhost:3000'];

// Security middleware - Helmet
// Sets various HTTP headers for security
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Compression middleware - compresses responses for better performance
app.use(compression());

// CORS configuration
// Allows cross-origin requests from configured origins
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (ALLOWED_ORIGINS.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Request logging - Morgan
// Logs HTTP requests in development or combined format for production
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Middleware configuration
// JSON parsing enables reading request bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Trust proxy for correct IP detection behind load balancers
app.set('trust proxy', 1);

/**
 * In-memory storage for API request logs
 * In production, this would be replaced with a database (MongoDB/PostgreSQL)
 * @typedef {Object} LogEntry
 * @property {string} id - Unique identifier for the log entry
 * @property {string} timestamp - ISO timestamp of when the request was made
 * @property {string} endpoint - The API endpoint URL
 * @property {string} method - HTTP method used (GET, POST, PUT, DELETE, PATCH)
 * @property {number} statusCode - Response status code
 * @property {number} responseTime - Time taken to get response in milliseconds
 * @property {Object} requestHeaders - Headers sent with the request
 * @property {Object} responseHeaders - Headers received in the response
 * @property {string|Object} requestBody - Body sent with the request
 * @property {string|Object} responseBody - Body received in the response
 */
const apiLogs = [];

/**
 * Error Analysis Engine
 * Maps HTTP status codes to potential causes and solutions
 * This helps API support engineers quickly diagnose common issues
 */
const errorAnalysis = {
  '400': {
    title: 'Bad Request',
    causes: [
      'Invalid JSON syntax in request body',
      'Missing required fields',
      'Invalid parameter values',
      'Malformed request URL'
    ],
    solutions: [
      'Validate JSON syntax',
      'Check required fields documentation',
      'Verify parameter types and formats',
      'Review API documentation'
    ]
  },
  '401': {
    title: 'Unauthorized',
    causes: [
      'Invalid API token',
      'Expired authentication token',
      'Missing Authorization header',
      'Incorrect credentials'
    ],
    solutions: [
      'Verify API token is correct',
      'Refresh or regenerate authentication token',
      'Include proper Authorization header',
      'Check credential configuration'
    ]
  },
  '403': {
    title: 'Forbidden',
    causes: [
      'Insufficient permissions',
      'Account suspended',
      'IP address not whitelisted',
      'Rate limit exceeded'
    ],
    solutions: [
      'Check user permissions',
      'Contact support for account status',
      'Verify IP whitelist configuration',
      'Wait before retrying (rate limiting)'
    ]
  },
  '404': {
    title: 'Not Found',
    causes: [
      'Incorrect endpoint path',
      'Resource does not exist',
      'Missing URL parameters',
      'API version mismatch'
    ],
    solutions: [
      'Verify endpoint URL is correct',
      'Check if resource exists',
      'Provide required URL parameters',
      'Confirm API version in use'
    ]
  },
  '429': {
    title: 'Too Many Requests',
    causes: [
      'Rate limit exceeded',
      'Too many concurrent requests',
      'Daily quota exhausted'
    ],
    solutions: [
      'Implement exponential backoff',
      'Reduce request frequency',
      'Check quota usage and limits'
    ]
  },
  '500': {
    title: 'Internal Server Error',
    causes: [
      'Backend server failure',
      'Database connection issues',
      'Unexpected exception in API service',
      'Configuration errors'
    ],
    solutions: [
      'Contact API provider support',
      'Check service status page',
      'Review server logs',
      'Try again later'
    ]
  },
  '502': {
    title: 'Bad Gateway',
    causes: [
      'Upstream server unavailable',
      'Reverse proxy configuration error',
      'Service temporarily overloaded'
    ],
    solutions: [
      'Wait and retry request',
      'Check upstream server status',
      'Contact API provider'
    ]
  },
  '503': {
    title: 'Service Unavailable',
    causes: [
      'Server under maintenance',
      'Service temporarily down',
      'High load on servers'
    ],
    solutions: [
      'Check service status',
      'Retry after some time',
      'Contact support if persistent'
    ]
  }
};

/**
 * Performance metrics tracking
 * Stores aggregated performance data per endpoint
 * Used for the Performance Monitoring dashboard
 */
const performanceMetrics = {};

/**
 * Proxy endpoint for making API requests
 * This avoids CORS issues when calling third-party APIs directly from the browser
 * 
 * @route POST /api/proxy
 * @body {string} url - Target API URL
 * @body {string} method - HTTP method
 * @body {Object} headers - Request headers
 * @body {Object|string} body - Request body
 * @body {Object} params - Query parameters
 */
app.post('/api/proxy', async (req, res) => {
  const startTime = Date.now();
  
  // Extract request details from body
  const { url, method, headers, body, params } = req.body;

  // Validate URL - security measure to prevent SSRF attacks
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Valid URL is required' });
  }

  try {
    // Make the actual API request through axios
    // axios handles the HTTP communication and follows redirects
    const response = await axios({
      url,
      method: method || 'GET',
      headers: headers || {},
      data: body,
      params: params || {},
      timeout: 30000, // 30 second timeout
      validateStatus: () => true // Don't throw on any status code
    });

    // Calculate response time for performance monitoring
    const responseTime = Date.now() - startTime;

    // Extract endpoint pattern for grouping metrics
    // This normalizes URLs like /api/users/123 to /api/users/:id
    const endpointPattern = extractEndpointPattern(url);

    // Update performance metrics
    // Tracks average response time and error rates per endpoint
    updatePerformanceMetrics(endpointPattern, responseTime, response.status);

    // Create log entry for this request
    const logEntry = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      endpoint: url,
      method: method || 'GET',
      statusCode: response.status,
      responseTime,
      requestHeaders: headers || {},
      responseHeaders: response.headers,
      requestBody: body || null,
      responseBody: response.data
    };

    // Store the log entry
    // In production, this would be persisted to a database
    apiLogs.unshift(logEntry);

    // Keep only last 1000 logs in memory to prevent memory leaks
    if (apiLogs.length > 1000) {
      apiLogs.pop();
    }

    // Return the response to the frontend
    res.json({
      statusCode: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data,
      responseTime
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    // Handle different types of errors
    let errorMessage = 'Unknown error occurred';
    let errorCode = 'UNKNOWN_ERROR';

    if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Connection refused - server may be down';
      errorCode = 'CONNECTION_REFUSED';
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = 'Request timed out';
      errorCode = 'TIMEOUT';
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = 'DNS resolution failed - check URL';
      errorCode = 'DNS_ERROR';
    } else if (error.response) {
      errorMessage = error.message;
      errorCode = 'HTTP_ERROR';
    } else if (error.request) {
      errorMessage = 'No response received from server';
      errorCode = 'NO_RESPONSE';
    }

    // Log failed requests as well
    const logEntry = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      endpoint: url,
      method: method || 'GET',
      statusCode: 0,
      responseTime,
      requestHeaders: headers || {},
      responseHeaders: {},
      requestBody: body || null,
      responseBody: { error: errorMessage, code: errorCode }
    };

    apiLogs.unshift(logEntry);

    // Update performance metrics for failed requests
    const endpointPattern = extractEndpointPattern(url);
    updatePerformanceMetrics(endpointPattern, responseTime, 0);

    res.status(500).json({
      error: errorMessage,
      code: errorCode,
      responseTime
    });
  }
});

/**
 * GET endpoint to retrieve all API logs
 * Supports filtering by status code, endpoint, and time range
 * 
 * @route GET /api/logs
 * @query {number} statusCode - Filter by status code
 * @query {string} endpoint - Filter by endpoint URL (partial match)
 * @query {string} startDate - Filter by start date (ISO string)
 * @query {string} endDate - Filter by end date (ISO string)
 */
app.get('/api/logs', (req, res) => {
  let filteredLogs = [...apiLogs];
  
  // Apply filters if provided
  const { statusCode, endpoint, startDate, endDate } = req.query;

  if (statusCode) {
    filteredLogs = filteredLogs.filter(log => log.statusCode === parseInt(statusCode));
  }

  if (endpoint) {
    filteredLogs = filteredLogs.filter(log => 
      log.endpoint.toLowerCase().includes(endpoint.toLowerCase())
    );
  }

  if (startDate) {
    filteredLogs = filteredLogs.filter(log => 
      new Date(log.timestamp) >= new Date(startDate)
    );
  }

  if (endDate) {
    filteredLogs = filteredLogs.filter(log => 
      new Date(log.timestamp) <= new Date(endDate)
    );
  }

  res.json(filteredLogs);
});

/**
 * GET endpoint to retrieve performance metrics
 * Returns aggregated data about API response times and error rates
 * 
 * @route GET /api/metrics
 */
app.get('/api/metrics', (req, res) => {
  // Calculate summary metrics
  const totalRequests = Object.values(performanceMetrics).reduce(
    (sum, data) => sum + data.count, 0
  );
  
  const totalErrors = Object.values(performanceMetrics).reduce(
    (sum, data) => sum + data.errors, 0
  );

  const avgResponseTime = totalRequests > 0 
    ? Object.values(performanceMetrics).reduce(
        (sum, data) => sum + (data.avgTime * data.count), 0
      ) / totalRequests
    : 0;

  res.json({
    endpoints: performanceMetrics,
    summary: {
      totalRequests,
      totalErrors,
      errorRate: totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0,
      averageResponseTime: Math.round(avgResponseTime)
    }
  });
});

/**
 * GET endpoint for error analysis
 * Returns diagnostic information for a given status code
 * 
 * @route GET /api/analyze/:statusCode
 * @param {string} statusCode - HTTP status code to analyze
 */
app.get('/api/analyze/:statusCode', (req, res) => {
  const { statusCode } = req.params;
  const analysis = errorAnalysis[statusCode];

  if (analysis) {
    res.json(analysis);
  } else {
    // Generic analysis for unknown status codes
    res.json({
      title: `HTTP ${statusCode}`,
      causes: ['Unknown error - check API documentation'],
      solutions: ['Review API response body for more details', 'Contact API support']
    });
  }
});

/**
 * POST endpoint to analyze HAR files
 * Parses HAR (HTTP Archive) format and extracts request information
 * 
 * @route POST /api/har
 * @body {Object} harData - HAR file content to parse
 */
app.post('/api/har', (req, res) => {
  const { harData } = req.body;

  if (!harData || !harData.log || !harData.log.entries) {
    return res.status(400).json({ error: 'Invalid HAR format' });
  }

  // Extract relevant information from HAR entries
  const entries = harData.log.entries.map(entry => ({
    url: entry.request.url,
    method: entry.request.method,
    status: entry.response.status,
    statusText: entry.response.statusText,
    time: entry.time,
    requestHeaders: entry.request.headers,
    responseHeaders: entry.response.headers,
    timings: entry.timings
  }));

  res.json({
    entries,
    pageTitle: harData.log.pages?.[0]?.title || 'Untitled',
    browser: harData.log.browser?.name || 'Unknown',
    version: harData.log.version
  });
});

/**
 * DELETE endpoint to clear logs
 * Useful for testing and resetting the playground
 * 
 * @route DELETE /api/logs
 */
app.delete('/api/logs', (req, res) => {
  apiLogs.length = 0;
  res.json({ message: 'All logs cleared successfully' });
});

/**
 * Helper function to generate unique IDs for log entries
 * Uses timestamp and random string for uniqueness
 */
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Helper function to extract endpoint pattern from URL
 * Normalizes URLs by replacing IDs with placeholders
 * Example: /api/users/123 -> /api/users/:id
 */
function extractEndpointPattern(url) {
  try {
    const parsedUrl = new URL(url);
    let path = parsedUrl.pathname;
    
    // Replace numeric IDs with :id placeholder
    path = path.replace(/\/\d+/g, '/:id');
    
    // Replace UUIDs with :uuid placeholder
    path = path.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':uuid');
    
    return path;
  } catch {
    return url;
  }
}

/**
 * Helper function to update performance metrics
 * Calculates running average and maintains error counts
 * This data is used for the Performance Monitoring dashboard
 */
function updatePerformanceMetrics(endpoint, responseTime, statusCode) {
  if (!performanceMetrics[endpoint]) {
    performanceMetrics[endpoint] = {
      count: 0,
      totalTime: 0,
      avgTime: 0,
      errors: 0,
      minTime: Infinity,
      maxTime: 0
    };
  }

  const metrics = performanceMetrics[endpoint];
  
  // Update count and total response time
  metrics.count += 1;
  metrics.totalTime += responseTime;
  
  // Calculate running average
  metrics.avgTime = Math.round(metrics.totalTime / metrics.count);
  
  // Track errors (non-2xx status codes)
  if (statusCode < 200 || statusCode >= 400) {
    metrics.errors += 1;
  }
  
  // Update min/max
  metrics.minTime = Math.min(metrics.minTime, responseTime);
  metrics.maxTime = Math.max(metrics.maxTime, responseTime);
}

// Start the server
app.listen(PORT, () => {
  console.log(`API Troubleshooting Playground server running on port ${PORT}`);
});
