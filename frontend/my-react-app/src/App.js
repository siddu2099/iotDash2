import React, { useState, useEffect } from 'react';
import DataCard from './components/DataCard';
import ChartDisplay from './components/ChartDisplay';
import AnomalyPanel from './components/AnomalyPanel';
import ReportPanel from './components/ReportPanel';
import DownloadReportButton from './components/DownloadReportButton';
import './App.css';

function App() {
  // IoT Data State
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  
  // ML Anomaly Detection State
  const [anomalies, setAnomalies] = useState(null);
  const [anomalyStats, setAnomalyStats] = useState(null);
  const [mlLoading, setMlLoading] = useState(false);
  const [mlError, setMlError] = useState(null);

  const fetchData = async () => {
    try {
      setError(null);
      const response = await fetch('http://localhost:5000/api/data');
      
      if (!response.ok) {
        throw new Error('Failed to fetch data from server');
      }
      
      const result = await response.json();
      setData(result);
      setLastUpdate(new Date());
      setLoading(false);
      
      if (result && result.feeds && result.feeds.length > 0) {
        detectAnomalies(result.feeds);
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
      console.error('Error fetching data:', err);
    }
  };

  const detectAnomalies = async (feeds) => {
    try {
      setMlLoading(true);
      setMlError(null);
      
      const field1Data = feeds.map(feed => feed.field1);
      const field2Data = feeds.map(feed => feed.field2);
      
      const response = await fetch('http://localhost:5000/api/ml/detect-anomalies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          field1_data: field1Data,
          field2_data: field2Data
        })
      });
      
      if (!response.ok) {
        throw new Error('ML service unavailable');
      }
      
      const mlResult = await response.json();
      
      if (mlResult.success) {
        setAnomalies(mlResult.anomalies);
        setAnomalyStats(mlResult.statistics);
      }
      
      setMlLoading(false);
    } catch (err) {
      setMlError(err.message);
      setMlLoading(false);
      console.error('Error detecting anomalies:', err);
    }
  };

  useEffect(() => {
    fetchData();
    
    const interval = setInterval(() => {
      fetchData();
    }, 20000);

    return () => clearInterval(interval);
  }, []);

  const getLatestValue = (field) => {
    if (!data || !data.feeds || data.feeds.length === 0) return null;
    const latestFeed = data.feeds[data.feeds.length - 1];
    return latestFeed[field];
  };

  return (
    <div className="app">
      <header className="hero-header">
        <div className="hero-background"></div>
        <div className="hero-content">
          <div className="hero-icon">📡</div>
          <h1 className="hero-title">Ultrasonic Object Detection Dashboard</h1>
          <p className="hero-subtitle">Real-time IoT Monitoring with K-Means ML Analytics</p>
          <div className="hero-info">
            <div className="info-item">
              <span className="info-label">Channel ID</span>
              <span className="info-value">3063140</span>
            </div>
            <div className="info-item">
              <span className="info-label">Platform</span>
              <span className="info-value">ThingSpeak Cloud</span>
            </div>
            {lastUpdate && (
              <div className="info-item">
                <span className="info-label">Last Update</span>
                <span className="info-value">{lastUpdate.toLocaleTimeString()}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="main-content">
        {loading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Fetching IoT data...</p>
          </div>
        )}

        {error && (
          <div className="error-container">
            <div className="error-icon">⚠️</div>
            <h2 className="error-title">Connection Error</h2>
            <p className="error-message">{error}</p>
            <button className="retry-button" onClick={fetchData}>
              Retry Connection
            </button>
          </div>
        )}

        {!loading && !error && data && (
          <>
            <section className="cards-section">
              <DataCard
                title="Field 1 - Distance"
                value={getLatestValue('field1')}
                unit="cm"
                icon="📏"
              />
              <DataCard
                title="Field 2 - Status"
                value={getLatestValue('field2')}
                unit=""
                icon="🎯"
              />
            </section>

            <section className="ml-section">
              <AnomalyPanel 
                anomalies={anomalies}
                statistics={anomalyStats}
                loading={mlLoading}
                error={mlError}
              />
            </section>

            <section className="charts-section">
              <ChartDisplay
                title="Field 1 - Distance Readings Over Time"
                data={data.feeds}
                dataKey="field1"
                color="#00d4ff"
                unit="cm"
              />
              <ChartDisplay
                title="Field 2 - Status Values Over Time"
                data={data.feeds}
                dataKey="field2"
                color="#ff006e"
                unit=""
              />
            </section>

            <section className="report-section">
              <ReportPanel />
            </section>

            <section className="download-section">
              <DownloadReportButton />
            </section>

            <footer className="dashboard-footer">
              <p>Auto-refreshing every 20 seconds • ThingSpeak API • ML: K-Means Clustering • PDF Reports Available</p>
            </footer>
          </>
        )}
      </main>
    </div>
  );
}

export default App;