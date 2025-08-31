import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

function CreateWorkout({ user, onBack }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    exercises: []
  });
  
  const [availableExercises, setAvailableExercises] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchExercises();
  }, []);

  const fetchExercises = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/exercises`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Handle new response structure
      if (response.data.success) {
        setAvailableExercises(response.data.data || []);
      } else {
        setAvailableExercises([]);
      }
    } catch (error) {
      console.error('Error fetching exercises:', error);
      setAvailableExercises([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addExercise = () => {
    setFormData(prev => ({
      ...prev,
      exercises: [...prev.exercises, {
        exercise: '',
        sets: 3,
        reps: 10,
        weight: 0,
        duration: 0,
        restTime: 60,
        notes: ''
      }]
    }));
  };

  const removeExercise = (index) => {
    setFormData(prev => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index)
    }));
  };

  const updateExercise = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      exercises: prev.exercises.map((exercise, i) => 
        i === index ? { ...exercise, [field]: value } : exercise
      )
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.description) {
      setError('Please fill in workout name and description');
      return;
    }

    if (formData.exercises.length === 0) {
      setError('Please add at least one exercise');
      return;
    }

    // Validate that all exercises have been selected
    const hasEmptyExercises = formData.exercises.some(ex => !ex.exercise);
    if (hasEmptyExercises) {
      setError('Please select an exercise for all exercise items');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.post(`${API_BASE_URL}/api/workouts`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        // Navigate back to workout list
        onBack();
      } else {
        setError(response.data.message || 'Failed to create workout');
      }
    } catch (error) {
      console.error('Error creating workout:', error);
      if (error.response?.data?.errors) {
        // Display validation errors
        const errorMessages = error.response.data.errors.map(err => err.msg).join(', ');
        setError(`Validation error: ${errorMessages}`);
      } else {
        setError(error.response?.data?.message || 'Failed to create workout');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-workout">
      <div className="form-header">
        <h2>Create New Workout</h2>
        <button onClick={onBack} className="back-btn">← Back to Workouts</button>
      </div>

      {error && <div className="error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Workout Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description *</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            required
            rows="3"
          />
        </div>

        <div className="form-group">
          <label>Add Exercises to Workout</label>
          <button type="button" onClick={addExercise} className="add-exercise-btn">
            + Add Exercise
          </button>

          {formData.exercises.length > 0 && (
            <div className="exercises-list">
              {formData.exercises.map((exercise, index) => (
                <div key={index} className="exercise-item">
                  <div className="exercise-header">
                    <h4>Exercise {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeExercise(index)}
                      className="remove-btn"
                    >
                      ×
                    </button>
                  </div>

                  <div className="exercise-fields">
                    <div className="form-group">
                      <label>Exercise *</label>
                      <select
                        value={exercise.exercise}
                        onChange={(e) => updateExercise(index, 'exercise', e.target.value)}
                        required
                      >
                        <option value="">Select an exercise...</option>
                        {availableExercises.map(ex => (
                          <option key={ex._id} value={ex._id}>
                            {ex.name} ({ex.category})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Sets *</label>
                        <input
                          type="number"
                          value={exercise.sets}
                          onChange={(e) => updateExercise(index, 'sets', parseInt(e.target.value))}
                          min="1"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Reps *</label>
                        <input
                          type="number"
                          value={exercise.reps}
                          onChange={(e) => updateExercise(index, 'reps', parseInt(e.target.value))}
                          min="1"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Weight (kg)</label>
                        <input
                          type="number"
                          value={exercise.weight}
                          onChange={(e) => updateExercise(index, 'weight', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.5"
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Duration (seconds)</label>
                        <input
                          type="number"
                          value={exercise.duration}
                          onChange={(e) => updateExercise(index, 'duration', parseInt(e.target.value) || 0)}
                          min="0"
                        />
                      </div>

                      <div className="form-group">
                        <label>Rest Time (seconds)</label>
                        <input
                          type="number"
                          value={exercise.restTime}
                          onChange={(e) => updateExercise(index, 'restTime', parseInt(e.target.value) || 60)}
                          min="0"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Notes</label>
                      <textarea
                        value={exercise.notes}
                        onChange={(e) => updateExercise(index, 'notes', e.target.value)}
                        rows="2"
                        placeholder="Any additional notes for this exercise..."
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-actions">
          <button type="button" onClick={onBack} className="cancel-btn">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Creating...' : 'Create Workout'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateWorkout;


