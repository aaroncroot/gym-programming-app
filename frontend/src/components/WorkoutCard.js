import React, { useState } from 'react';

function WorkoutCard({ workout, user, onDelete }) {
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
    if (window.confirm('Are you sure you want to delete this workout?')) {
      onDelete(workout._id);
    }
  };

  return (
    <div className="workout-card">
      <div className="workout-header">
        <h3>{workout.name}</h3>
        <div className="workout-status">
          <span className={`status ${workout.isActive ? 'active' : 'inactive'}`}>
            {workout.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      <div className="workout-info">
        <p className="description">{workout.description}</p>
        
        <div className="workout-meta">
          <div className="meta-item">
            <span className="label">Frequency:</span>
            <span>{getFrequencyText(workout.frequency)}</span>
          </div>
          <div className="meta-item">
            <span className="label">Duration:</span>
            <span>{workout.duration} weeks</span>
          </div>
          <div className="meta-item">
            <span className="label">Exercises:</span>
            <span>{workout.exercises.length}</span>
          </div>
          <div className="meta-item">
            <span className="label">Created:</span>
            <span>{formatDate(workout.createdAt)}</span>
          </div>
        </div>

        {user?.role === 'trainer' && (
          <div className="client-info">
            <span className="label">Assigned to:</span>
            <span>{workout.client?.username || 'Unknown Client'}</span>
          </div>
        )}

        {user?.role === 'client' && (
          <div className="trainer-info">
            <span className="label">Created by:</span>
            <span>{workout.trainer?.username || 'Unknown Trainer'}</span>
          </div>
        )}
      </div>

      <div className="workout-actions">
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
        <div className="workout-details">
          <h4>Exercise Details</h4>
          <div className="exercises-list">
            {workout.exercises.map((exerciseItem, index) => (
              <div key={index} className="exercise-detail">
                <div className="exercise-name">
                  <strong>{exerciseItem.exercise?.name || 'Unknown Exercise'}</strong>
                </div>
                <div className="exercise-specs">
                  <span>{exerciseItem.sets} sets</span>
                  <span>{exerciseItem.reps} reps</span>
                  {exerciseItem.weight > 0 && (
                    <span>{exerciseItem.weight}kg</span>
                  )}
                  {exerciseItem.restTime > 0 && (
                    <span>{exerciseItem.restTime}s rest</span>
                  )}
                </div>
                {exerciseItem.notes && (
                  <div className="exercise-notes">
                    <em>Notes: {exerciseItem.notes}</em>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default WorkoutCard;