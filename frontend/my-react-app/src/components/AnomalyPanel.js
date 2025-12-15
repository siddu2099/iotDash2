import React from 'react';
import './AnomalyPanel.css';

const AnomalyPanel = ({ anomalies, statistics, loading, error }) => {
  if (loading) {
    return (
      <div className="anomaly-panel">
        <div className="anomaly-header">
          <h2 className="anomaly-title">🤖 AI Anomaly Detection</h2>
        </div>
        <div className="anomaly-loading">
          <div className="ml-spinner"></div>
          <p>Analyzing data patterns...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="anomaly-panel">
        <div className="anomaly-header">
          <h2 className="anomaly-title">🤖 AI Anomaly Detection</h2>
        </div>
        <div className="anomaly-error">
          <p>⚠️ ML Service Unavailable</p>
          <p className="error-detail">{error}</p>
        </div>
      </div>
    );
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return '#ff006e';
      case 'medium':
        return '#ff9500';
      case 'low':
        return '#ffcc00';
      default:
        return '#00d4ff';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'high':
        return '🚨';
      case 'medium':
        return '⚠️';
      case 'low':
        return '⚡';
      default:
        return '📊';
    }
  };

  return (
    <div className="anomaly-panel">
      <div className="anomaly-header">
        <h2 className="anomaly-title">🤖 AI Anomaly Detection</h2>
        <div className="ml-badge">K-Means Clustering</div>
      </div>

      {/* Statistics Section */}
      {statistics && (
        <div className="anomaly-stats">
          <div className="stat-item">
            <span className="stat-label">Total Points</span>
            <span className="stat-value">{statistics.total_points}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Anomalies Found</span>
            <span className="stat-value anomaly-count">{statistics.anomaly_count}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Anomaly Rate</span>
            <span className="stat-value">{statistics.anomaly_percentage}%</span>
          </div>
        </div>
      )}

      {/* Anomalies List */}
      <div className="anomalies-container">
        {anomalies && anomalies.length > 0 ? (
          <>
            <h3 className="anomalies-subtitle">Detected Anomalies</h3>
            <div className="anomalies-list">
              {anomalies.map((anomaly, idx) => (
                <div 
                  key={idx} 
                  className="anomaly-item"
                  style={{ borderLeftColor: getSeverityColor(anomaly.severity) }}
                >
                  <div className="anomaly-icon">
                    {getSeverityIcon(anomaly.severity)}
                  </div>
                  <div className="anomaly-details">
                    <div className="anomaly-value-row">
                      <span className="anomaly-label">Value:</span>
                      <span className="anomaly-value">{anomaly.value}</span>
                    </div>
                    <div className="anomaly-meta">
                      <span className="anomaly-index">Point #{anomaly.index + 1}</span>
                      <div className="severity-info">
                        <span className={`anomaly-severity severity-${anomaly.severity}`}>
                          {anomaly.severity.toUpperCase()}
                        </span>
                        {anomaly.severity_score && (
                          <span className="severity-score">
                            {(anomaly.severity_score * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="no-anomalies">
            <div className="no-anomalies-icon">✅</div>
            <p className="no-anomalies-text">No anomalies detected</p>
            <p className="no-anomalies-subtext">All sensor readings are within normal range</p>
          </div>
        )}
      </div>

      {/* Model Info */}
      {statistics && (
        <div className="model-info">
          <div className="info-row">
            <span className="info-key">Mean:</span>
            <span className="info-val">{statistics.mean}</span>
          </div>
          <div className="info-row">
            <span className="info-key">Std Dev:</span>
            <span className="info-val">{statistics.std}</span>
          </div>
          <div className="info-row">
            <span className="info-key">Range:</span>
            <span className="info-val">{statistics.min} - {statistics.max}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnomalyPanel;
