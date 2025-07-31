import React, { useState } from 'react';

function ProgramCard({ program, user, onDelete }) {
  const [showDetails, setShowDetails] = useState(false);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getFrequencyText = (frequency) => {
    const frequencyMap = {
      'daily': 'Daily',
      '3x-week': '3x per week',
      '4x-week': '4x per week',
      '5x-week': '5x per week',
      'weekly': 'Weekly'
    };
    return frequencyMap[frequency] || frequency;
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this program?')) {
      onDelete(program._id);
    }
  };

  return (
    <div className="program-card">
      <div className="program-header">
        <h3>{program.name}</h3>
        <div className="program-status">
          <span className={`status ${program.isActive ? 'active' : 'inactive'}`}>
            {program.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      <div className="program-info">
        <p className="description">{program.description}</p>
        
        <div className="program-meta">
          <div className="meta-item">
            <span className="label">Frequency:</span>
            <span>{getFrequencyText(program.frequency)}</span>
          </div>
          <div className="meta-item">
            <span className="label">Duration:</span>
            <span>{program.duration} weeks</span>
          </div>
          <div className="meta-item">
            <span className="label">Workouts:</span>
            <span>{program.workouts?.length || 0}</span>
          </div>
          <div className="meta-item">
            <span className="label">Created:</span>
            <span>{formatDate(program.createdAt)}</span>
          </div>
        </div>

        {user?.role === 'trainer' && (
          <div className="client-info">
            <span className="label">Assigned to:</span>
            <span>{program.client?.username || 'No client assigned'}</span>
          </div>
        )}

        {user?.role === 'client' && (
          <div className="trainer-info">
            <span className="label">Created by:</span>
            <span>{program.trainer?.username || 'Unknown Trainer'}</span>
          </div>
        )}
      </div>

      <div className="program-actions">
        <button 
          onClick={() => setShowDetails(!showDetails)}
          className="details-btn"
        >
          {showDetails ? 'Hide Details' : 'View Details'}
        </button>
        
        {user?.role === 'trainer' && (
          <button 
            onClick={handleDelete}
            className="delete-btn"
          >
            Delete
          </button>
        )}
      </div>

      {showDetails && (
        <div className="program-details">
          <h4>Workout Schedule</h4>
          <div className="workouts-list">
            {program.workouts?.map((workout, index) => (
              <div key={index} className="workout-detail">
                <div className="workout-name">
                  <strong>{workout.name}</strong>
                </div>
                <div className="workout-exercises">
                  {workout.exercises?.map((exerciseItem, exerciseIndex) => (
                    <div key={exerciseIndex} className="exercise-item">
                      <span>{exerciseItem.exercise?.name || 'Unknown Exercise'}</span>
                      <span>{exerciseItem.sets} sets × {exerciseItem.reps} reps</span>
                      {exerciseItem.weight > 0 && (
                        <span>{exerciseItem.weight}kg</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProgramCard; 