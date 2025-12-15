// Email Service using Resend API
// Handles asynchronous email notifications for anomaly alerts

const fetch = require('node-fetch');
require('dotenv').config();

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const ALERT_RECIPIENT = process.env.ALERT_RECIPIENT || 'sganta633@gmail.com';
const SENDER_EMAIL = 'onboarding@resend.dev'; // Resend's default sender for testing

/**
 * Send anomaly alert email via Resend API
 * @param {Object} anomalyData - Data about detected anomalies
 * @param {Array} anomalyData.anomalies - Array of anomaly objects
 * @param {Object} anomalyData.statistics - Statistics about the data
 * @param {string} anomalyData.channelId - ThingSpeak channel ID
 * @returns {Promise<Object>} Response from Resend API
 */
async function sendAnomalyAlert(anomalyData) {
  try {
    // Validate API key
    if (!RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY not configured in .env');
      return { success: false, error: 'API key not configured' };
    }

    const { anomalies, statistics, channelId } = anomalyData;

    // Extract anomaly values for email
    const anomalyValues = anomalies.map(a => a.value);
    const highSeverityCount = anomalies.filter(a => a.severity === 'high').length;
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // Build email HTML content
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
    .container { background: white; border-radius: 12px; padding: 30px; max-width: 600px; margin: 0 auto; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .alert-icon { font-size: 48px; margin: 10px 0; }
    .content { padding: 20px 0; }
    .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
    .stat-box { background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea; }
    .stat-label { font-size: 12px; color: #666; text-transform: uppercase; margin-bottom: 5px; }
    .stat-value { font-size: 24px; font-weight: bold; color: #333; }
    .anomaly-list { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .anomaly-item { padding: 10px; background: white; margin: 8px 0; border-radius: 6px; display: flex; justify-content: space-between; }
    .severity-badge { padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: bold; text-transform: uppercase; }
    .severity-high { background: #dc3545; color: white; }
    .severity-medium { background: #fd7e14; color: white; }
    .severity-low { background: #ffc107; color: #333; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; border-top: 1px solid #eee; margin-top: 20px; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="alert-icon">🚨</div>
      <h1>IoT Anomaly Alert</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Ultrasonic Object Detection System</p>
    </div>
    
    <div class="content">
      <p style="font-size: 16px; color: #333;">
        <strong>${anomalies.length} anomal${anomalies.length === 1 ? 'y' : 'ies'}</strong> detected in your IoT sensor data.
        ${highSeverityCount > 0 ? `<span style="color: #dc3545; font-weight: bold;">${highSeverityCount} high severity alert${highSeverityCount === 1 ? '' : 's'}!</span>` : ''}
      </p>

      <div class="stat-grid">
        <div class="stat-box">
          <div class="stat-label">Channel ID</div>
          <div class="stat-value">${channelId || '3063140'}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Total Points</div>
          <div class="stat-value">${statistics?.total_points || 'N/A'}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Mean Value</div>
          <div class="stat-value">${statistics?.mean || 'N/A'}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Anomaly Rate</div>
          <div class="stat-value">${statistics?.anomaly_percentage || 'N/A'}%</div>
        </div>
      </div>

      <div class="anomaly-list">
        <h3 style="margin-top: 0; color: #856404;">Detected Anomalies</h3>
        ${anomalies.slice(0, 5).map((anomaly, idx) => `
          <div class="anomaly-item">
            <span>
              <strong>Point #${anomaly.index + 1}:</strong> ${anomaly.value}
            </span>
            <span class="severity-badge severity-${anomaly.severity}">
              ${anomaly.severity}
            </span>
          </div>
        `).join('')}
        ${anomalies.length > 5 ? `<p style="margin: 10px 0 0 0; color: #856404;">...and ${anomalies.length - 5} more</p>` : ''}
      </div>

      <p style="color: #666; font-size: 14px;">
        <strong>Timestamp:</strong> ${timestamp} UTC<br>
        <strong>Detection Model:</strong> Ensemble AI (Isolation Forest + LOF + SVM)
      </p>

      <center>
        <a href="http://localhost:3000" class="button">View Dashboard</a>
      </center>
    </div>

    <div class="footer">
      <p>This is an automated alert from your IoT Monitoring System.</p>
      <p>ThingSpeak Channel: ${channelId || '3063140'} | ML Service: Active</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    // Plain text version (fallback)
    const textContent = `
🚨 IoT Anomaly Alert

Anomaly Detected in Ultrasonic Object Detection System

Channel ID: ${channelId || '3063140'}
Total anomalies: ${anomalies.length}
High severity: ${highSeverityCount}
Values: [${anomalyValues.join(', ')}]
Anomaly rate: ${statistics?.anomaly_percentage || 'N/A'}%
Timestamp: ${timestamp} UTC

Detection Model: Ensemble AI (Isolation Forest + LOF + SVM)

View your dashboard at: http://localhost:3000
    `.trim();

    // Prepare Resend API request
    const emailData = {
      from: SENDER_EMAIL,
      to: [ALERT_RECIPIENT],
      subject: `🚨 IoT Alert: ${anomalies.length} Anomal${anomalies.length === 1 ? 'y' : 'ies'} Detected`,
      html: htmlContent,
      text: textContent,
    };

    // Send email via Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Anomaly alert email sent successfully');
      console.log(`   📧 Recipient: ${ALERT_RECIPIENT}`);
      console.log(`   📊 Anomalies: ${anomalies.length}`);
      console.log(`   🆔 Email ID: ${result.id}`);
      return { success: true, data: result };
    } else {
      console.error('❌ Failed to send email:', result);
      return { success: false, error: result };
    }

  } catch (error) {
    console.error('❌ Error in sendAnomalyAlert:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Test email functionality
 * Use this to verify your Resend configuration
 */
async function sendTestEmail() {
  const testData = {
    anomalies: [
      { index: 5, value: 245.0, severity: 'high' },
      { index: 12, value: 0.0, severity: 'medium' },
      { index: 19, value: 230.5, severity: 'high' }
    ],
    statistics: {
      total_points: 50,
      mean: 12.5,
      anomaly_percentage: 6.0
    },
    channelId: '3063140'
  };

  console.log('📧 Sending test email...');
  const result = await sendAnomalyAlert(testData);
  return result;
}

module.exports = {
  sendAnomalyAlert,
  sendTestEmail
};