import React from 'react';
import './DataCard.css';

const DataCard = ({ title, value, unit, icon }) => {
  return (
    <div className="data-card">
      <div className="card-icon">{icon}</div>
      <div className="card-content">
        <h3 className="card-title">{title}</h3>
        <div className="card-value">
          <span className="value-number">{value !== null && value !== undefined ? value : '--'}</span>
          {unit && <span className="value-unit">{unit}</span>}
        </div>
      </div>
      <div className="card-glow"></div>
    </div>
  );
};

export default DataCard;