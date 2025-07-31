import React, { useState, useEffect } from 'react';
import axios from 'axios';
import WorkoutCard from './WorkoutCard';

function WorkoutList({ user, onCreateNew }) {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchWorkouts();
  }, []);

  const fetchWorkouts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/workouts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Handle new response structure
      if (response.data.success) {
        setWorkouts(response.data.data || []);
      } else {
        setWorkouts([]);
      }
    } catch (error) {
      setError('Failed to fetch workouts');
      console.error('Error fetching workouts:', error);
      setWorkouts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWorkout = async (workoutId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/workouts/${workoutId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setWorkouts(workouts.filter(workout => workout._id !== workoutId));
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete workout');
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
              onDelete={handleDeleteWorkout}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default WorkoutList;


