const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// =======================
// MIDDLEWARE
// =======================
app.use(cors());
app.use(express.json());

// =======================
// ENVIRONMENT VARIABLES
// =======================
const THINGSPEAK_CHANNEL_ID = process.env.THINGSPEAK_CHANNEL_ID;
const THINGSPEAK_API_KEY = process.env.THINGSPEAK_API_KEY;
const ML_SERVICE_URL = process.env.ML_SERVICE_URL;

if (!THINGSPEAK_CHANNEL_ID || !THINGSPEAK_API_KEY || !ML_SERVICE_URL) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

// ThingSpeak URL
const THINGSPEAK_URL =
  `https://api.thingspeak.com/channels/${THINGSPEAK_CHANNEL_ID}/feeds.json` +
  `?api_key=${THINGSPEAK_API_KEY}&results=50`;

// =======================
// HEALTH CHECK
// =======================
app.get('/health', (req, res) => {
  res.json({
    status: 'Backend running',
    timestamp: new Date().toISOString()
  });
});

// =======================
// THINGSPEAK DATA
// =======================
app.get('/api/data', async (req, res) => {
  try {
    const response = await axios.get(THINGSPEAK_URL, { timeout: 10000 });
    res.json(response.data);
  } catch (error) {
    console.error('ThingSpeak error:', error.message);
    res.status(500).json({
      error: 'Failed to fetch ThingSpeak data',
      message: error.message
    });
  }
});

// =======================
// ML SERVICE PROXY ROUTES
// =======================

// ML Health
app.get('/api/ml/health', async (req, res) => {
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/health`, { timeout: 5000 });
    res.json({
      mlServiceAvailable: true,
      ...response.data
    });
  } catch (error) {
    res.json({
      mlServiceAvailable: false,
      status: 'ML service unavailable',
      message: error.message
    });
  }
});

// Detect anomalies
app.post('/api/ml/detect-anomalies', async (req, res) => {
  try {
    const response = await axios.post(
      `${ML_SERVICE_URL}/api/detect-anomalies`,
      req.body,
      { timeout: 15000 }
    );
    res.json(response.data);
  } catch (error) {
    console.error('ML detect error:', error.message);
    res.status(500).json({
      error: 'Failed to detect anomalies',
      message: error.message
    });
  }
});

// Train ML model
app.post('/api/ml/train-model', async (req, res) => {
  try {
    const response = await axios.post(
      `${ML_SERVICE_URL}/api/train-model`,
      req.body,
      { timeout: 20000 }
    );
    res.json(response.data);
  } catch (error) {
    console.error('ML train error:', error.message);
    res.status(500).json({
      error: 'Failed to train model',
      message: error.message
    });
  }
});

// =======================
// REPORT ROUTES (PROXIED)
// =======================

// JSON analytics report
app.get('/api/report', async (req, res) => {
  try {
    const response = await axios.get(
      `${ML_SERVICE_URL}/api/report`,
      { timeout: 15000 }
    );
    res.json(response.data);
  } catch (error) {
    console.error('Report error:', error.message);
    res.status(500).json({
      error: 'Failed to fetch report',
      message: error.message
    });
  }
});

// PDF download
app.get('/api/download-report', async (req, res) => {
  try {
    const response = await axios.get(
      `${ML_SERVICE_URL}/api/download-report`,
      { responseType: 'stream', timeout: 20000 }
    );

    res.setHeader(
      'Content-Disposition',
      response.headers['content-disposition'] || 'attachment; filename="report.pdf"'
    );
    res.setHeader('Content-Type', 'application/pdf');

    response.data.pipe(res);
  } catch (error) {
    console.error('PDF error:', error.message);
    res.status(500).json({
      error: 'Failed to download PDF',
      message: error.message
    });
  }
});

// =======================
// SYSTEM STATUS
// =======================
app.get('/api/status', async (req, res) => {
  const status = {
    backend: 'running',
    thingspeak: 'unknown',
    mlService: 'unknown'
  };

  try {
    await axios.get(THINGSPEAK_URL);
    status.thingspeak = 'connected';
  } catch {}

  try {
    await axios.get(`${ML_SERVICE_URL}/health`);
    status.mlService = 'connected';
  } catch {}

  res.json(status);
});

// =======================
// 404 HANDLER
// =======================
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// =======================
// START SERVER
// =======================
app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🚀 IoT Dashboard Backend');
  console.log(`📍 Port: ${PORT}`);
  console.log(`📊 ThingSpeak Channel: ${THINGSPEAK_CHANNEL_ID}`);
  console.log(`🤖 ML Service: ${ML_SERVICE_URL}`);
  console.log('='.repeat(60));
});
