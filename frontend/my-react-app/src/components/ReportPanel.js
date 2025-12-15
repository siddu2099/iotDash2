// ========================================
// FILE 3: frontend/my-react-app/src/components/ReportPanel.js
// ========================================

import React, { useState, useEffect } from 'react';
import './ReportPanel.css';

const ReportPanel = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5001/api/report');
      
      if (!response.ok) {
        throw new Error('Failed to fetch report');
      }
      
      const data = await response.json();
      setReport(data.report);
      setError(null);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
      console.error('Error fetching report:', err);
    }
  };

  useEffect(() => {
    fetchReport();
    const interval = setInterval(fetchReport, 120000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="report-panel">
        <h2 className="report-title">📊 Data Analytics Report</h2>
        <div className="report-loading">
          <div className="spinner"></div>
          <p>Generating report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="report-panel">
        <h2 className="report-title">📊 Data Analytics Report</h2>
        <div className="report-error">
          <p>⚠️ Unable to load report</p>
          <button onClick={fetchReport} className="retry-btn">Retry</button>
        </div>
      </div>
    );
  }

  if (!report) return null;

  const { summary, hourly, daily, latest_readings, metadata } = report;
  const { front_sensor, back_sensor, cross_analysis } = summary || {};

  return (
    <div className="report-panel">
      <div className="report-header">
        <h2 className="report-title">📊 Data Analytics Report</h2>
        <button onClick={fetchReport} className="refresh-btn" title="Refresh Report">
          🔄
        </button>
      </div>

      {/* Metadata Summary */}
      {metadata && (
        <div className="metadata-section">
          <div className="metadata-card">
            <span className="metadata-label">Entries Analyzed</span>
            <span className="metadata-value">{metadata.entries_analyzed || 0}</span>
          </div>
          <div className="metadata-card">
            <span className="metadata-label">Time Span</span>
            <span className="metadata-value">{metadata.time_span || 'N/A'}</span>
          </div>
          <div className="metadata-card">
            <span className="metadata-label">Last Updated</span>
            <span className="metadata-value">{metadata.last_updated?.split(' ')[1] || 'N/A'}</span>
          </div>
        </div>
      )}

      {/* Latest Readings */}
      {latest_readings && (
        <div className="latest-reading">
          <h3>📍 Latest Sensor Readings</h3>
          <div className="reading-grid">
            <div className="reading-item">
              <span className="reading-label">Front Sensor</span>
              <span className="reading-value">{latest_readings.front_sensor} cm</span>
            </div>
            <div className="reading-item">
              <span className="reading-label">Back Sensor</span>
              <span className="reading-value">{latest_readings.back_sensor} cm</span>
            </div>
            <div className="reading-item">
              <span className="reading-label">Timestamp</span>
              <span className="reading-value">{latest_readings.timestamp}</span>
            </div>
            <div className="reading-item">
              <span className="reading-label">Age</span>
              <span className="reading-value">{latest_readings.age_minutes} min</span>
            </div>
          </div>
        </div>
      )}

      {/* Dual Sensor Statistics */}
      <div className="dual-sensor-stats">
        {/* Front Sensor */}
        {front_sensor && (
          <div className="sensor-card front-sensor">
            <h3>📍 Front Sensor (Field 1)</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Mean</span>
                <span className="stat-value">{front_sensor.mean} cm</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Median</span>
                <span className="stat-value">{front_sensor.median} cm</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Std Dev</span>
                <span className="stat-value">{front_sensor.std} cm</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Range</span>
                <span className="stat-value">{front_sensor.range} cm</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Min</span>
                <span className="stat-value">{front_sensor.min} cm</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Max</span>
                <span className="stat-value">{front_sensor.max} cm</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Count</span>
                <span className="stat-value">{front_sensor.count}</span>
              </div>
              {front_sensor.trend && (
                <div className="stat-item trend">
                  <span className="stat-label">Trend</span>
                  <span className={`stat-value trend-${front_sensor.trend.trend}`}>
                    {front_sensor.trend.trend} ({front_sensor.trend.change_percent > 0 ? '+' : ''}{front_sensor.trend.change_percent}%)
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Back Sensor */}
        {back_sensor && (
          <div className="sensor-card back-sensor">
            <h3>📍 Back Sensor (Field 2)</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Mean</span>
                <span className="stat-value">{back_sensor.mean} cm</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Median</span>
                <span className="stat-value">{back_sensor.median} cm</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Std Dev</span>
                <span className="stat-value">{back_sensor.std} cm</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Range</span>
                <span className="stat-value">{back_sensor.range} cm</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Min</span>
                <span className="stat-value">{back_sensor.min} cm</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Max</span>
                <span className="stat-value">{back_sensor.max} cm</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Count</span>
                <span className="stat-value">{back_sensor.count}</span>
              </div>
              {back_sensor.trend && (
                <div className="stat-item trend">
                  <span className="stat-label">Trend</span>
                  <span className={`stat-value trend-${back_sensor.trend.trend}`}>
                    {back_sensor.trend.trend} ({back_sensor.trend.change_percent > 0 ? '+' : ''}{back_sensor.trend.change_percent}%)
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Cross Analysis */}
      {cross_analysis && (
        <div className="cross-analysis">
          <h3>🔄 Comparative Analysis</h3>
          <div className="comparison-grid">
            <div className="comparison-item">
              <span className="comp-label">Avg Difference</span>
              <span className="comp-value">{cross_analysis.avg_difference} cm</span>
            </div>
            <div className="comparison-item">
              <span className="comp-label">Correlation</span>
              <span className="comp-value">{cross_analysis.correlation}</span>
            </div>
            <div className="comparison-item">
              <span className="comp-label">Front/Back Ratio</span>
              <span className="comp-value">{cross_analysis.front_back_ratio}</span>
            </div>
            <div className="comparison-item">
              <span className="comp-label">Data Completeness</span>
              <span className="comp-value">{cross_analysis.data_completeness}</span>
            </div>
            <div className="comparison-item">
              <span className="comp-label">Front Readings</span>
              <span className="comp-value">{cross_analysis.readings_front}</span>
            </div>
            <div className="comparison-item">
              <span className="comp-label">Back Readings</span>
              <span className="comp-value">{cross_analysis.readings_back}</span>
            </div>
          </div>
        </div>
      )}

      {/* Daily Stats Tables */}
      {daily && (daily.front_sensor?.length > 0 || daily.back_sensor?.length > 0) && (
        <div className="daily-stats-section">
          <h3>📅 Daily Statistics (Last 3 Days)</h3>
          
          <div className="daily-stats-dual">
            {daily.front_sensor && daily.front_sensor.length > 0 && (
              <div className="daily-table-wrapper">
                <h4>Front Sensor</h4>
                <table className="stats-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Avg</th>
                      <th>Min</th>
                      <th>Max</th>
                      <th>Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {daily.front_sensor.slice(-3).map((stat, idx) => (
                      <tr key={idx}>
                        <td>{stat.day}</td>
                        <td className="stat-avg">{stat.avg} cm</td>
                        <td className="stat-min">{stat.min} cm</td>
                        <td className="stat-max">{stat.max} cm</td>
                        <td>{stat.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {daily.back_sensor && daily.back_sensor.length > 0 && (
              <div className="daily-table-wrapper">
                <h4>Back Sensor</h4>
                <table className="stats-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Avg</th>
                      <th>Min</th>
                      <th>Max</th>
                      <th>Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {daily.back_sensor.slice(-3).map((stat, idx) => (
                      <tr key={idx}>
                        <td>{stat.day}</td>
                        <td className="stat-avg">{stat.avg} cm</td>
                        <td className="stat-min">{stat.min} cm</td>
                        <td className="stat-max">{stat.max} cm</td>
                        <td>{stat.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportPanel;