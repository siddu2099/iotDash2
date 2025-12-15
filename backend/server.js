const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// ThingSpeak Configuration
const THINGSPEAK_CHANNEL_ID = '3063140';
const THINGSPEAK_API_KEY = 'PCAIQZSVKW8HW3CT';
const THINGSPEAK_URL = `https://api.thingspeak.com/channels/${THINGSPEAK_CHANNEL_ID}/feeds.json?api_key=${THINGSPEAK_API_KEY}&results=50`;

// ML Service Configuration
const ML_SERVICE_URL = 'http://localhost:5001';

// ========================================
// ThingSpeak Data Routes
// ========================================

// Route to fetch IoT data from ThingSpeak
app.get('/api/data', async (req, res) => {
  try {
    console.log('Fetching data from ThingSpeak...');
    const response = await axios.get(THINGSPEAK_URL);
    
    console.log('Data fetched successfully');
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching ThingSpeak data:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch data from ThingSpeak',
      message: error.message 
    });
  }
});

// ========================================
// ML Service Routes
// ========================================

// Proxy to ML service for anomaly detection
app.post('/api/ml/detect-anomalies', async (req, res) => {
  try {
    console.log('Forwarding anomaly detection request to ML service...');
    
    const response = await axios.post(
      `${ML_SERVICE_URL}/api/detect-anomalies`,
      req.body,
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    console.log('Anomaly detection completed');
    
    // Just return the data - no email notifications
    if (response.data.success && response.data.anomalies && response.data.anomalies.length > 0) {
      console.log(`📊 ${response.data.anomalies.length} anomalies detected`);
    } else {
      console.log('✓ No anomalies detected');
    }
    
    res.json(response.data);
  } catch (error) {
    console.error('Error calling ML service:', error.message);
    res.status(500).json({ 
      error: 'Failed to detect anomalies',
      message: error.message,
      mlServiceAvailable: false
    });
  }
});

// Check ML service health
app.get('/api/ml/health', async (req, res) => {
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/health`);
    res.json({ 
      ...response.data, 
      mlServiceAvailable: true 
    });
  } catch (error) {
    res.json({ 
      status: 'ML Service is not available',
      mlServiceAvailable: false,
      message: error.message
    });
  }
});

// Retrain ML model
app.post('/api/ml/train-model', async (req, res) => {
  try {
    console.log('Forwarding model training request to ML service...');
    
    const response = await axios.post(
      `${ML_SERVICE_URL}/api/train-model`,
      req.body,
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    console.log('Model training completed');
    res.json(response.data);
  } catch (error) {
    console.error('Error training ML model:', error.message);
    res.status(500).json({ 
      error: 'Failed to train model',
      message: error.message
    });
  }
});

// ========================================
// Health Check Routes
// ========================================

// Backend health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'Backend is running',
    timestamp: new Date().toISOString(),
    services: {
      thingspeak: 'connected',
      mlService: ML_SERVICE_URL
    }
  });
});

// System status
app.get('/api/status', async (req, res) => {
  const status = {
    backend: {
      status: 'running',
      port: PORT,
      timestamp: new Date().toISOString()
    },
    thingspeak: {
      channelId: THINGSPEAK_CHANNEL_ID,
      status: 'connected'
    },
    mlService: {
      url: ML_SERVICE_URL,
      status: 'unknown'
    }
  };
  
  // Check ML service status
  try {
    const mlResponse = await axios.get(`${ML_SERVICE_URL}/health`, { timeout: 2000 });
    status.mlService.status = 'running';
    status.mlService.details = mlResponse.data;
  } catch (error) {
    status.mlService.status = 'unavailable';
    status.mlService.error = error.message;
  }
  
  res.json(status);
});

// ========================================
// Error Handling
// ========================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// ========================================
// Start Server
// ========================================

app.listen(PORT, () => {
  console.log('=' .repeat(60));
  console.log('🚀 IoT Dashboard Backend Server');
  console.log('=' .repeat(60));
  console.log(`📍 Server running on: http://localhost:${PORT}`);
  console.log(`📊 ThingSpeak Channel: ${THINGSPEAK_CHANNEL_ID}`);
  console.log(`🤖 ML Service: ${ML_SERVICE_URL}`);
  console.log('-' .repeat(60));
  console.log('🔗 Available Endpoints:');
  console.log('   GET  /health                      - Backend health check');
  console.log('   GET  /api/status                  - System status');
  console.log('   GET  /api/data                    - Fetch ThingSpeak data');
  console.log('   POST /api/ml/detect-anomalies     - Detect anomalies');
  console.log('   GET  /api/ml/health               - ML service health');
  console.log('   POST /api/ml/train-model          - Train ML model');
  console.log('=' .repeat(60));
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});