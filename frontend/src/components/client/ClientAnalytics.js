import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ClientAnalytics.css';

const ClientAnalytics = ({ user }) => {
  const [analytics, setAnalytics] = useState(null);
  const [progress, setProgress] = useState({});
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showProgressForm, setShowProgressForm] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: '', description: '', targetDate: '', reminderEnabled: false });

  useEffect(() => {
    fetchAnalytics();
    fetchProgress();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/analytics/client');
      setAnalytics(response.data.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const fetchProgress = async () => {
    try {
      const response = await axios.get('/api/analytics/client/progress');
      setProgress(response.data.data.progress);
      setGoals(response.data.data.goals);
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  const saveProgress = async (progressData) => {
    try {
      await axios.post('/api/analytics/client/progress', progressData);
      await fetchProgress();
      setShowProgressForm(false);
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const saveGoal = async () => {
    try {
      await axios.post('/api/analytics/client/goals', newGoal);
      await fetchProgress();
      setNewGoal({ title: '', description: '', targetDate: '', reminderEnabled: false });
      setShowGoalForm(false);
    } catch (error) {
      console.error('Error saving goal:', error);
    }
  };

  if (loading) {
    return <div className="analytics-loading">Loading your progress...</div>;
  }

  if (error) {
    return <div className="analytics-error">{error}</div>;
  }

  return (
    <div className="client-analytics">
      <div className="analytics-header">
        <h2>📈 My Progress</h2>
        <p>Track your fitness journey and achievements</p>
      </div>

      {/* Progress Overview */}
      <div className="progress-overview">
        <div className="stat-card">
          <h3>Total Workouts</h3>
          <div className="stat-value">{analytics?.totalWorkouts || 0}</div>
          <div className="stat-label">Completed workouts</div>
        </div>
        <div className="stat-card">
          <h3>Completion Rate</h3>
          <div className="stat-value">{analytics?.completionRate || 0}%</div>
          <div className="stat-label">Workouts completed</div>
        </div>
        <div className="stat-card">
          <h3>Last Workout</h3>
          <div className="stat-value">
            {analytics?.lastWorkout ? 
              new Date(analytics.lastWorkout).toLocaleDateString() : 
              'Never'
            }
          </div>
          <div className="stat-label">Most recent session</div>
        </div>
      </div>

      {/* Progress Insights */}
      <div className="progress-insights">
        <h3>Your Progress Insights</h3>
        <div className="insights-grid">
          <div className="insight-card">
            <div className="insight-icon"></div>
            <h4>Consistency</h4>
            <p>You've completed {analytics?.totalWorkouts || 0} workouts with a {analytics?.completionRate || 0}% completion rate.</p>
          </div>
          <div className="insight-card">
            <div className="insight-icon"></div>
            <h4>Progress Tracking</h4>
            <p>Track your improvements and celebrate your achievements.</p>
          </div>
          <div className="insight-card">
            <div className="insight-icon"></div>
            <h4>Strength Building</h4>
            <p>Continue building strength and endurance through consistent training.</p>
          </div>
          <div className="insight-card">
            <div className="insight-icon"></div>
            <h4>Achievement</h4>
            <p>Every completed workout brings you closer to your goals.</p>
          </div>
        </div>
      </div>

      {/* Progress Tracking Section */}
      <div className="progress-tracking">
        <div className="section-header">
          <h3>📈 Progress Tracking</h3>
          <button onClick={() => setShowProgressForm(true)} className="add-btn">
            + Update Progress
          </button>
        </div>

        {showProgressForm && (
          <div className="progress-form">
            <h4>Update Your Progress</h4>
            
            {/* Weight */}
            <div className="form-group">
              <label>Weight (kg):</label>
              <input 
                type="number" 
                value={progress.weight || ''} 
                onChange={(e) => setProgress({...progress, weight: parseFloat(e.target.value)})}
                placeholder="Enter weight"
              />
            </div>

            {/* One Rep Maxes */}
            <div className="form-group">
              <label>One Rep Maxes:</label>
              <div className="max-inputs">
                {['Bench Press', 'Squat', 'Deadlift', 'Overhead Press'].map(exercise => (
                  <div key={exercise} className="max-input">
                    <span>{exercise}:</span>
                    <input 
                      type="number" 
                      value={progress.oneRepMaxes?.[exercise] || ''} 
                      onChange={(e) => setProgress({
                        ...progress, 
                        oneRepMaxes: {
                          ...progress.oneRepMaxes,
                          [exercise]: parseFloat(e.target.value)
                        }
                      })}
                      placeholder="kg"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Body Measurements */}
            <div className="form-group">
              <label>Body Measurements (cm):</label>
              <div className="measurement-inputs">
                {['Chest', 'Waist', 'Hips', 'Biceps', 'Thighs', 'Calves', 'Shoulders', 'Neck'].map(measurement => (
                  <div key={measurement} className="measurement-input">
                    <span>{measurement}:</span>
                    <input 
                      type="number" 
                      value={progress.measurements?.[measurement.toLowerCase()] || ''} 
                      onChange={(e) => setProgress({
                        ...progress, 
                        measurements: {
                          ...progress.measurements,
                          [measurement.toLowerCase()]: parseFloat(e.target.value)
                        }
                      })}
                      placeholder="cm"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="form-actions">
              <button onClick={() => saveProgress(progress)} className="save-btn">
                Save Progress
              </button>
              <button onClick={() => setShowProgressForm(false)} className="cancel-btn">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Display Current Progress */}
        <div className="current-progress">
          {progress.weight && (
            <div className="progress-item">
              <strong>Current Weight:</strong> {progress.weight}kg
            </div>
          )}
          
          {Object.keys(progress.oneRepMaxes || {}).length > 0 && (
            <div className="progress-item">
              <strong>One Rep Maxes:</strong>
              <div className="max-display">
                {Object.entries(progress.oneRepMaxes).map(([exercise, weight]) => (
                  <span key={exercise}>{exercise}: {weight}kg</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Goals Section */}
      <div className="goals-section">
        <div className="section-header">
          <h3>🎯 Goals</h3>
          <button onClick={() => setShowGoalForm(true)} className="add-btn">
            + Add Goal
          </button>
        </div>

        {showGoalForm && (
          <div className="goal-form">
            <h4>Add New Goal</h4>
            <div className="form-group">
              <label>Goal Title:</label>
              <input 
                type="text" 
                value={newGoal.title} 
                onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
                placeholder="e.g., Lose 5kg"
              />
            </div>
            <div className="form-group">
              <label>Description:</label>
              <textarea 
                value={newGoal.description} 
                onChange={(e) => setNewGoal({...newGoal, description: e.target.value})}
                placeholder="Describe your goal in detail..."
              />
            </div>
            <div className="form-group">
              <label>Target Date:</label>
              <input 
                type="date" 
                value={newGoal.targetDate} 
                onChange={(e) => setNewGoal({...newGoal, targetDate: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>
                <input 
                  type="checkbox" 
                  checked={newGoal.reminderEnabled} 
                  onChange={(e) => setNewGoal({...newGoal, reminderEnabled: e.target.checked})}
                />
                Monthly reminder to check progress
              </label>
            </div>
            <div className="form-actions">
              <button onClick={saveGoal} className="save-btn">
                Save Goal
              </button>
              <button onClick={() => setShowGoalForm(false)} className="cancel-btn">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Display Goals */}
        <div className="goals-list">
          {goals.map(goal => (
            <div key={goal._id} className={`goal-item ${goal.completed ? 'completed' : ''}`}>
              <div className="goal-header">
                <h4>{goal.title}</h4>
                <span className="goal-date">
                  {new Date(goal.targetDate).toLocaleDateString()}
                </span>
              </div>
              <p>{goal.description}</p>
              {goal.reminderEnabled && (
                <span className="reminder-badge"> Monthly Reminder</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Enhanced Motivation Section */}
      <div className="motivation-section">
        <h3>Keep Going! 💪</h3>
        <p>Consistency is the key to success. Every workout, every measurement, every goal brings you closer to your best self. Stay focused and trust the process!</p>
        <div className="motivation-stats">
          <div className="motivation-stat">
            <span></span>
            <span>{goals.length} Goals Set</span>
          </div>
          <div className="motivation-stat">
            <span></span>
            <span>{analytics?.totalWorkouts || 0} Workouts Completed</span>
          </div>
          <div className="motivation-stat">
            <span></span>
            <span>{analytics?.completionRate || 0}% Completion Rate</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientAnalytics; 