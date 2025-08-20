import React, { useState } from 'react';
import axios from 'axios';
import './DataExport.css';

const DataExport = ({ user }) => {
  const [exporting, setExporting] = useState(false);
  const [exportType, setExportType] = useState('client_progress');
  const [selectedClient, setSelectedClient] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const exportData = async () => {
    try {
      setExporting(true);
      
      const params = {
        type: exportType,
        clientId: selectedClient,
        startDate: dateRange.start,
        endDate: dateRange.end
      };

      const response = await axios.get('/api/analytics/export', {
        params,
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${exportType}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
    } catch (error) {
      console.error('Error exporting data:', error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="data-export">
      <h2>📊 Data Export</h2>
      
      <div className="export-options">
        <div className="export-type">
          <label>Export Type:</label>
          <select value={exportType} onChange={(e) => setExportType(e.target.value)}>
            <option value="client_progress">Client Progress</option>
            <option value="workout_completion">Workout Completion</option>
            <option value="program_effectiveness">Program Effectiveness</option>
            <option value="revenue_analytics">Revenue Analytics</option>
          </select>
        </div>

        <div className="date-range">
          <label>Date Range:</label>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
            placeholder="Start Date"
          />
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
            placeholder="End Date"
          />
        </div>

        <button 
          onClick={exportData}
          disabled={exporting}
          className="export-btn"
        >
          {exporting ? 'Exporting...' : 'Export Data'}
        </button>
      </div>
    </div>
  );
};

export default DataExport; 