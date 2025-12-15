import React, { useState } from 'react';
import './DownloadReportButton.css';

const DownloadReportButton = () => {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      setError(null);
      
      console.log('📄 Requesting PDF report...');
      
      // Fetch PDF from Flask service
      const response = await fetch('http://localhost:5001/api/download-report');
      
      if (!response.ok) {
        throw new Error('Failed to generate report');
      }
      
      // Get the PDF blob
      const blob = await response.blob();
      
      // Get filename from header or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'IoT_Daily_Report.pdf';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('✅ PDF downloaded successfully');
      setDownloading(false);
      
    } catch (err) {
      console.error('❌ Error downloading report:', err);
      setError(err.message);
      setDownloading(false);
    }
  };

  return (
    <div className="download-report-container">
      <button 
        className={`download-report-btn ${downloading ? 'downloading' : ''}`}
        onClick={handleDownload}
        disabled={downloading}
      >
        {downloading ? (
          <>
            <span className="btn-icon spinner">⟳</span>
            <span className="btn-text">Generating PDF...</span>
          </>
        ) : (
          <>
            <span className="btn-icon">📄</span>
            <span className="btn-text">Download Daily Report</span>
          </>
        )}
      </button>
      
      {error && (
        <div className="download-error">
          <span className="error-icon">⚠️</span>
          <span className="error-text">{error}</span>
        </div>
      )}
      
      {!error && !downloading && (
        <p className="download-hint">
          Generate a comprehensive PDF report with statistics, breaches, and health status
        </p>
      )}
    </div>
  );
};

export default DownloadReportButton;