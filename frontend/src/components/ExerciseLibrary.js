import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ExerciseCard from './ExerciseCard';
import CreateExercise from './CreateExercise';
import VideoManager from './VideoManager';
import ExerciseListItem from './ExerciseListItem';

function ExerciseLibrary({ user }) {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showVideoManager, setShowVideoManager] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterMuscleGroup, setFilterMuscleGroup] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchExercises();
  }, []);

  const fetchExercises = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/exercises', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Handle new response structure
      if (response.data.success) {
        setExercises(response.data.data || []);
      } else {
        setExercises([]);
      }
    } catch (error) {
      setError('Failed to fetch exercises');
      console.error('Error fetching exercises:', error);
      setExercises([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExercise = async (exerciseData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/exercises', exerciseData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setExercises([...exercises, response.data.data]);
        setShowCreateForm(false);
      } else {
        setError(response.data.message || 'Failed to create exercise');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create exercise');
    }
  };

  const filteredExercises = exercises.filter(exercise => {
    const matchesCategory = !filterCategory || exercise.category === filterCategory;
    const matchesMuscleGroup = !filterMuscleGroup || exercise.muscleGroup === filterMuscleGroup;
    const matchesSearch = !searchTerm || 
      exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exercise.instructions.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesMuscleGroup && matchesSearch;
  });

  if (loading) {
    return <div className="loading">Loading exercises...</div>;
  }

  return (
    <div className="exercise-library">
      <div className="library-header">
        <h2>Exercise Library</h2>
        {user?.role === 'trainer' && (
          <div className="trainer-actions">
            <button 
              className="video-manager-btn"
              onClick={() => setShowVideoManager(true)}
            >
              📹 Manage Videos
            </button>
            <button 
              className="create-exercise-btn"
              onClick={() => setShowCreateForm(true)}
            >
              + Add Exercise
            </button>
          </div>
        )}
      </div>

      {error && <div className="error">{error}</div>}

      <div className="filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search exercises..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-options">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="strength">Strength</option>
            <option value="cardio">Cardio</option>
            <option value="flexibility">Flexibility</option>
            <option value="balance">Balance</option>
            <option value="sports">Sports</option>
          </select>

          <select
            value={filterMuscleGroup}
            onChange={(e) => setFilterMuscleGroup(e.target.value)}
          >
            <option value="">All Muscle Groups</option>
            <option value="chest">Chest</option>
            <option value="back">Back</option>
            <option value="shoulders">Shoulders</option>
            <option value="arms">Arms</option>
            <option value="legs">Legs</option>
            <option value="core">Core</option>
            <option value="full-body">Full Body</option>
            <option value="cardio">Cardio</option>
          </select>
        </div>
      </div>

      <div className="exercises-grid">
        {filteredExercises.length === 0 ? (
          <div className="no-exercises">
            <p>No exercises found matching your criteria.</p>
          </div>
        ) : (
          filteredExercises.map(exercise => (
            <ExerciseCard 
              key={exercise._id}
              exercise={exercise}
              user={user}
              onUpdate={fetchExercises}
            />
          ))
        )}
      </div>

      {showCreateForm && (
        <CreateExercise 
          user={user}
          onSubmit={handleCreateExercise}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {showVideoManager && (
        <VideoManager 
          user={user}
          onClose={() => setShowVideoManager(false)}
        />
      )}
    </div>
  );
}

export default ExerciseLibrary;
