import React, { useState, useEffect } from 'react';
import axios from 'axios';
import WorkoutCard from './WorkoutCard';
import { API_BASE_URL } from '../config';

function WorkoutList({ user, onCreateNew }) {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchWorkouts = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/workouts`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        setWorkouts(response.data.workouts || []);
      } catch (error) {
        console.error('Error fetching workouts:', error);
      }
    };
    fetchWorkouts();
  }, []);

  const handleDelete = async (workoutId) => {
    if (window.confirm('Are you sure you want to delete this workout?')) {
      try {
        await axios.delete(`${API_BASE_URL}/api/workouts/${workoutId}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        setWorkouts(workouts.filter(workout => workout._id !== workoutId));
      } catch (error) {
        console.error('Error deleting workout:', error);
      }
    }
  };

  if (loading) {
    return <div className="loading">Loading workouts...</div>;
  }

  return (
    <div className="workout-list">
      <div className="workout-header">
        <h2>
          {user?.role === 'trainer' ? 'My Created Workouts' : 'My Assigned Workouts'}
        </h2>
        {user?.role === 'trainer' && (
          <button 
            className="create-workout-btn"
            onClick={onCreateNew}
          >
            + Create New Workout
          </button>
        )}
      </div>

      {error && <div className="error">{error}</div>}

      <div className="workouts-grid">
        {workouts.length === 0 ? (
          <div className="no-workouts">
            <p>
              {user?.role === 'trainer' 
                ? 'No workouts created yet. Create your first workout!' 
                : 'No workouts assigned yet. Contact your trainer to get started!'
              }
            </p>
          </div>
        ) : (
          workouts.map(workout => (
            <WorkoutCard 
              key={workout._id}
              workout={workout}
              user={user}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default WorkoutList;


