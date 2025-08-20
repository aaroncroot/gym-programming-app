import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TrainerAnalytics.css';

const TrainerAnalytics = ({ user }) => {
  const [analytics, setAnalytics] = useState(null);
  const [clientStats, setClientStats] = useState([]);
  const [programStats, setProgramStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(30);
  const [clientQuickView, setClientQuickView] = useState([]);

  useEffect(() => {
    fetchAnalytics();
    fetchClientQuickView();
  }, [selectedPeriod]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [overviewRes, clientsRes, programsRes] = await Promise.all([
        axios.get(`/api/analytics/trainer?days=${selectedPeriod}`),
        axios.get('/api/analytics/clients'),
        axios.get('/api/analytics/programs')
      ]);

      setAnalytics(overviewRes.data.data);
      setClientStats(clientsRes.data.data);
      setProgramStats(programsRes.data.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClientQuickView = async () => {
    try {
      const response = await axios.get('/api/analytics/clients');
      const clients = response.data.data;
      
      // Sort by month completion rate (lowest first) and highlight missed streaks
      const sortedClients = clients
        .sort((a, b) => a.monthCompletion - b.monthCompletion)
        .map(client => ({
          ...client,
          isHighlighted: client.hasMissedStreak
        }));
      
      setClientQuickView(sortedClients);
    } catch (error) {
      console.error('Error fetching client quick view:', error);
    }
  };

  if (loading) {
    return <div className="analytics-loading">Loading analytics...</div>;
  }

  return (
    <div className="trainer-analytics">
      <div className="analytics-header">
        <h2>📊 Trainer Analytics</h2>
        <div className="period-selector">
          <label>Time Period:</label>
          <select 
            value={selectedPeriod} 
            onChange={(e) => setSelectedPeriod(e.target.value)}
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>
      </div>

      <div className="analytics-layout">
        {/* Client Quick View Panel */}
        <div className="client-quick-view">
          <h3>📊 Client Progress This Month</h3>
          <div className="client-list">
            {clientQuickView.map(client => (
              <div 
                key={client._id} 
                className={`client-item ${client.isHighlighted ? 'highlighted' : ''}`}
              >
                <div className="client-name">
                  {client.firstName} {client.lastName}
                </div>
                <div className="completion-rate">
                  {client.monthCompletion}%
                </div>
                {client.isHighlighted && (
                  <div className="missed-streak">
                    ⚠️ {client.missedWorkouts} missed workouts
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Analytics Content */}
        <div className="main-analytics">
          {/* Overview Cards */}
          <div className="analytics-overview">
            <div className="stat-card">
              <h3>Total Clients</h3>
              <div className="stat-value">{analytics?.totalClients || 0}</div>
            </div>
            <div className="stat-card">
              <h3>Total Workouts</h3>
              <div className="stat-value">{analytics?.totalWorkouts || 0}</div>
            </div>
            <div className="stat-card">
              <h3>Avg Completion Rate</h3>
              <div className="stat-value">{analytics?.avgCompletionRate || 0}%</div>
            </div>
            <div className="stat-card">
              <h3>Monthly Revenue</h3>
              <div className="stat-value">${analytics?.monthlyRevenue || 0}</div>
            </div>
            <div className="stat-card">
              <h3>Active Subscriptions</h3>
              <div className="stat-value">{analytics?.activeSubscriptions || 0}</div>
            </div>
          </div>

          {/* Enhanced Client Performance */}
          <div className="analytics-section">
            <h3>Client Performance</h3>
            <div className="client-stats">
              {clientStats.map(client => (
                <div key={client._id} className="client-stat-card">
                  <div className="client-info">
                    <h4>{client.firstName} {client.lastName}</h4>
                    <p>{client.email}</p>
                  </div>
                  <div className="completion-breakdown">
                    <div className="completion-period">
                      <span>This Week:</span>
                      <span className={client.weekCompletion < 50 ? 'low' : ''}>
                        {client.weekCompletion}%
                      </span>
                    </div>
                    <div className="completion-period">
                      <span>This Month:</span>
                      <span className={client.monthCompletion < 50 ? 'low' : ''}>
                        {client.monthCompletion}%
                      </span>
                    </div>
                    <div className="completion-period">
                      <span>All Time:</span>
                      <span>{client.completionRate}%</span>
                    </div>
                  </div>
                  <div className="client-metrics">
                    <div className="metric">
                      <span>Total Workouts:</span>
                      <span>{client.totalWorkouts}</span>
                    </div>
                    <div className="metric">
                      <span>Last Active:</span>
                      <span>{client.lastWorkout ? new Date(client.lastWorkout).toLocaleDateString() : 'Never'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Program Performance */}
          <div className="analytics-section">
            <h3>Program Performance</h3>
            <div className="program-stats">
              {programStats.map(program => (
                <div key={program._id} className="program-stat-card">
                  <div className="program-info">
                    <h4>{program.name}</h4>
                    <p>{program.category}</p>
                  </div>
                  <div className="program-metrics">
                    <div className="metric">
                      <span>Times Assigned:</span>
                      <span>{program.timesAssigned}</span>
                    </div>
                    <div className="metric">
                      <span>Times Completed:</span>
                      <span>{program.timesCompleted}</span>
                    </div>
                    <div className="metric">
                      <span>Avg Rating:</span>
                      <span>{program.avgRating || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainerAnalytics; 