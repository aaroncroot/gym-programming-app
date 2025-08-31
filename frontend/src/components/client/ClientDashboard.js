import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ClientDashboard.css';
import WorkoutExecution from './WorkoutExecution';
import { API_BASE_URL } from '../../config';

const ClientDashboard = ({ user }) => {
  const [assignedPrograms, setAssignedPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [showWorkoutExecution, setShowWorkoutExecution] = useState(false);

  useEffect(() => {
    fetchAssignedPrograms();
  }, []);

  const fetchAssignedPrograms = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/programs`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setAssignedPrograms(response.data.data);
    } catch (error) {
      console.error('Error fetching programs:', error);
      setError('Failed to load your programs');
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = (program) => {
    if (!program.startDate || !program.duration) return 0;
    
    const startDate = new Date(program.startDate);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (program.duration * 7));
    const now = new Date();
    
    if (now < startDate) return 0;
    if (now > endDate) return 100;
    
    const totalDuration = endDate - startDate;
    const elapsed = now - startDate;
    return Math.round((elapsed / totalDuration) * 100);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleStartWorkout = (workout) => {
    setSelectedWorkout(workout);
    setShowWorkoutExecution(true);
  };

  const handleWorkoutComplete = () => {
    setShowWorkoutExecution(false);
    setSelectedWorkout(null);
    // Refresh programs to show updated progress
    fetchAssignedPrograms();
  };

  const handleBackToDashboard = () => {
    setShowWorkoutExecution(false);
    setSelectedWorkout(null);
  };

  if (loading) {
    return (
      <div className="client-dashboard">
        <div className="loading-spinner">Loading your programs...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="client-dashboard">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  if (showWorkoutExecution && selectedWorkout) {
    return (
      <WorkoutExecution 
        workout={selectedWorkout}
        onComplete={handleWorkoutComplete}
        onBack={handleBackToDashboard}
      />
    );
  }

  return (
    <div className="client-dashboard">
      <div className="dashboard-header">
        <h2>Welcome back, {user.firstName}! 💪</h2>
        <p>Track your progress and complete your workouts</p>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>{assignedPrograms.length}</h3>
          <p>Active Programs</p>
        </div>
        <div className="stat-card">
          <h3>{assignedPrograms.filter(p => p.isActive).length}</h3>
          <p>Current Programs</p>
        </div>
        <div className="stat-card">
          <h3>{assignedPrograms.reduce((total, p) => total + (p.workouts?.length || 0), 0)}</h3>
          <p>Total Workouts</p>
        </div>
      </div>

      <div className="programs-section">
        <h3>Your Programs</h3>
        
        {assignedPrograms.length === 0 ? (
          <div className="no-programs">
            <div className="no-programs-icon">📋</div>
            <h4>No programs assigned yet</h4>
            <p>Your trainer will assign programs to you once you're approved.</p>
          </div>
        ) : (
          <div className="programs-grid">
            {assignedPrograms.map(program => (
              <div key={program._id} className="program-card">
                <div className="program-header">
                  <h4>{program.name}</h4>
                  <span className={`status ${program.isActive ? 'active' : 'inactive'}`}>
                    {program.isActive ? 'Active' : 'Completed'}
                  </span>
                </div>
                
                <p className="program-description">{program.description}</p>
                
                <div className="program-details">
                  <div className="detail">
                    <span className="label">Duration:</span>
                    <span>{program.duration} weeks</span>
                  </div>
                  <div className="detail">
                    <span className="label">Workouts/Week:</span>
                    <span>{program.workoutsPerWeek}</span>
                  </div>
                  <div className="detail">
                    <span className="label">Start Date:</span>
                    <span>{formatDate(program.startDate)}</span>
                  </div>
                  <div className="detail">
                    <span className="label">Category:</span>
                    <span className={`category ${program.category}`}>
                      {program.category}
                    </span>
                  </div>
                </div>

                <div className="progress-section">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${calculateProgress(program)}%` }}
                    ></div>
                  </div>
                  <span className="progress-text">{calculateProgress(program)}% Complete</span>
                </div>

                <div className="program-actions">
                  <button 
                    className="btn-primary"
                    onClick={() => setSelectedProgram(program)}
                  >
                    View Details
                  </button>
                  <button className="btn-secondary">
                    Start Workout
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedProgram && (
        <div className="program-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{selectedProgram.name}</h3>
              <button 
                className="close-btn"
                onClick={() => setSelectedProgram(null)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <p>{selectedProgram.description}</p>
              
              <div className="workouts-list">
                <h4>Workouts</h4>
                {selectedProgram.workouts?.map((workout, index) => (
                  <div key={index} className="workout-item">
                    <div className="workout-info">
                      <span className="week-day">Week {workout.week}, Day {workout.day}</span>
                      {workout.notes && <span className="notes">{workout.notes}</span>}
                    </div>
                    <button 
                      className="btn-start-workout"
                      onClick={() => handleStartWorkout(workout)}
                    >
                      Start Workout
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDashboard; 