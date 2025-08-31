import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

function CreateProgram({ user, onBack }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    client: '',
    workoutsPerWeek: 3,
    duration: 4,
    weeks: [],
    isTemplate: false, // NEW: Track if this should be saved as template
    templateName: '' // NEW: Name for template if saving as template
  });
  
  const [availableWorkouts, setAvailableWorkouts] = useState([]);
  const [availableExercises, setAvailableExercises] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(1);
  const [copiedWeek, setCopiedWeek] = useState(null);
  const [showPasteOption, setShowPasteOption] = useState(false);

  useEffect(() => {
  const fetchWorkouts = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/workouts`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
        setAvailableWorkouts(response.data.data || []);
    } catch (error) {
      console.error('Error fetching workouts:', error);
      setAvailableWorkouts([]);
    }
  };

  const fetchExercises = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/exercises`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
        setAvailableExercises(response.data.data || []);
    } catch (error) {
      console.error('Error fetching exercises:', error);
      setAvailableExercises([]);
    }
  };

  const fetchClients = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/auth/users/clients`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
        setClients(response.data.data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      setClients([]);
    }
  };

    fetchWorkouts();
    fetchExercises();
    fetchClients();
  }, []);

  // Generate weeks structure when workoutsPerWeek or duration changes
  useEffect(() => {
    generateWeeksStructure();
  }, [formData.workoutsPerWeek, formData.duration]);

  const generateWeeksStructure = () => {
    const { workoutsPerWeek, duration } = formData;
    const weeks = [];
    
    for (let week = 1; week <= duration; week++) {
      const weekWorkouts = [];
      for (let day = 1; day <= workoutsPerWeek; day++) {
        weekWorkouts.push({
          day: day,
          workout: null,
          notes: '',
          isInlineWorkout: false,
          inlineExercises: []
        });
      }
      weeks.push({
        weekNumber: week,
        workouts: weekWorkouts
      });
    }
    
    setFormData(prev => ({
      ...prev,
      weeks: weeks
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const assignWorkoutToDay = (weekIndex, dayIndex, workoutId) => {
    if (workoutId === 'create-inline') {
      // Create inline workout
      setFormData(prev => ({
        ...prev,
        weeks: prev.weeks.map((week, wIndex) => 
          wIndex === weekIndex 
            ? {
                ...week,
                workouts: week.workouts.map((day, dIndex) => 
                  dIndex === dayIndex 
                    ? { 
                        ...day, 
                        workout: null,
                        isInlineWorkout: true,
                        inlineExercises: []
                      }
                    : day
                )
              }
            : week
        )
      }));
    } else {
      // Assign existing workout
      const workout = availableWorkouts.find(w => w._id === workoutId);
      if (workout) {
        setFormData(prev => ({
          ...prev,
          weeks: prev.weeks.map((week, wIndex) => 
            wIndex === weekIndex 
              ? {
                  ...week,
                  workouts: week.workouts.map((day, dIndex) => 
                    dIndex === dayIndex 
                      ? { 
                          ...day, 
                          workout: workout,
                          isInlineWorkout: false,
                          inlineExercises: []
                        }
                      : day
                  )
                }
              : week
          )
        }));
      }
    }
  };

  const removeWorkoutFromDay = (weekIndex, dayIndex) => {
    setFormData(prev => ({
      ...prev,
      weeks: prev.weeks.map((week, wIndex) => 
        wIndex === weekIndex 
          ? {
              ...week,
              workouts: week.workouts.map((day, dIndex) => 
                dIndex === dayIndex 
                  ? { 
                      ...day, 
                      workout: null,
                      isInlineWorkout: false,
                      inlineExercises: []
                    }
                  : day
              )
            }
          : week
      )
    }));
  };

  const addExerciseToInlineWorkout = (weekIndex, dayIndex) => {
    setFormData(prev => ({
      ...prev,
      weeks: prev.weeks.map((week, wIndex) => 
        wIndex === weekIndex 
          ? {
              ...week,
              workouts: week.workouts.map((day, dIndex) => 
                dIndex === dayIndex 
                  ? { 
                      ...day, 
                      inlineExercises: [
                        ...day.inlineExercises,
                        {
                          exercise: '',
                          sets: 3,
                          reps: 10,
                          weight: '',
                          duration: '',
                          restTime: 60,
                          notes: ''
                        }
                      ]
                    }
                  : day
              )
            }
          : week
      )
    }));
  };

  const updateInlineExercise = (weekIndex, dayIndex, exerciseIndex, field, value) => {
    setFormData(prev => ({
      ...prev,
      weeks: prev.weeks.map((week, wIndex) => 
        wIndex === weekIndex 
          ? {
              ...week,
              workouts: week.workouts.map((day, dIndex) => 
                dIndex === dayIndex 
                  ? { 
                      ...day, 
                      inlineExercises: day.inlineExercises.map((ex, exIndex) => 
                        exIndex === exerciseIndex 
                          ? { ...ex, [field]: value }
                          : ex
                      )
                    }
                  : day
              )
            }
          : week
      )
    }));
  };

  const removeInlineExercise = (weekIndex, dayIndex, exerciseIndex) => {
    setFormData(prev => ({
      ...prev,
      weeks: prev.weeks.map((week, wIndex) => 
        wIndex === weekIndex 
          ? {
              ...week,
              workouts: week.workouts.map((day, dIndex) => 
                dIndex === dayIndex 
                  ? { 
                      ...day, 
                      inlineExercises: day.inlineExercises.filter((_, exIndex) => exIndex !== exerciseIndex)
                    }
                  : day
              )
            }
          : week
      )
    }));
  };

  const updateDayNotes = (weekIndex, dayIndex, notes) => {
    setFormData(prev => ({
      ...prev,
      weeks: prev.weeks.map((week, wIndex) => 
        wIndex === weekIndex 
          ? {
              ...week,
              workouts: week.workouts.map((day, dIndex) => 
                dIndex === dayIndex 
                  ? { ...day, notes }
                  : day
              )
            }
          : week
      )
    }));
  };

  // REMOVED: saveInlineWorkout function - no longer needed

  const copyWeek = (weekIndex) => {
    setCopiedWeek(formData.weeks[weekIndex]);
    setShowPasteOption(true);
  };

  const pasteWeek = (targetWeekIndex) => {
    if (!copiedWeek) return;
    
    setFormData(prev => ({
      ...prev,
      weeks: prev.weeks.map((week, weekIndex) => 
        weekIndex === targetWeekIndex 
          ? {
              ...week,
              workouts: copiedWeek.workouts.map(workout => ({
                ...workout,
                notes: `${workout.notes} (copied from week ${copiedWeek.weekNumber})`
              }))
            }
          : week
      )
    }));
    
    setCopiedWeek(null);
    setShowPasteOption(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.description) {
      setError('Please fill in program name and description');
      return;
    }

    // If saving as template, require template name
    if (formData.isTemplate && !formData.templateName) {
      setError('Please provide a name for the template');
      return;
    }

    // Check if at least one workout is assigned
    const totalWorkouts = formData.weeks.reduce((total, week) => 
      total + week.workouts.filter(day => day.workout || day.isInlineWorkout).length, 0
    );
    
    if (totalWorkouts === 0) {
      setError('Please assign at least one workout to the program');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      
      // Flatten the weeks structure for the API
      const workouts = [];
      formData.weeks.forEach((week, weekIndex) => {
        week.workouts.forEach((day, dayIndex) => {
          if (day.workout || day.isInlineWorkout) {
            if (day.isInlineWorkout) {
              // Create inline workout data (stays within program only)
              workouts.push({
                week: weekIndex + 1,
                day: dayIndex + 1,
                notes: day.notes,
                isInlineWorkout: true,
                exercises: day.inlineExercises
              });
            } else {
              // Use existing workout
              workouts.push({
                workout: day.workout._id,
                week: weekIndex + 1,
                day: dayIndex + 1,
                notes: day.notes
              });
            }
          }
        });
      });

      const programData = {
        name: formData.isTemplate ? formData.templateName : formData.name,
        description: formData.description,
        client: formData.isTemplate ? null : (formData.client || null),
        workoutsPerWeek: formData.workoutsPerWeek,
        duration: formData.duration,
        workouts: workouts,
        isTemplate: formData.isTemplate
      };

      const response = await axios.post(`${API_BASE_URL}/api/programs`, programData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        onBack();
      } else {
        setError(response.data.message || 'Failed to create program');
      }
    } catch (error) {
      console.error('Error creating program:', error);
      if (error.response?.data?.errors) {
        const errorMessages = error.response.data.errors.map(err => err.msg).join(', ');
        setError(`Validation error: ${errorMessages}`);
      } else {
        setError(error.response?.data?.message || 'Failed to create program');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-program">
      <div className="form-header">
        <h2>Create New Program</h2>
        <button onClick={onBack} className="back-btn">← Back to Programs</button>
      </div>

      {error && <div className="error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Program Name *</label>
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

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="workoutsPerWeek">Workouts per Week *</label>
            <select
              id="workoutsPerWeek"
              name="workoutsPerWeek"
              value={formData.workoutsPerWeek}
              onChange={handleInputChange}
              required
            >
              {Array.from({ length: 14 }, (_, i) => i + 1).map(num => (
                <option key={num} value={num}>
                  {num} workout{num !== 1 ? 's' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="duration">Duration (weeks) *</label>
            <input
              type="number"
              id="duration"
              name="duration"
              value={formData.duration}
              onChange={handleInputChange}
              min="1"
              max="52"
              required
            />
          </div>
        </div>

        {/* NEW: Template Options */}
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              name="isTemplate"
              checked={formData.isTemplate}
              onChange={(e) => setFormData(prev => ({ ...prev, isTemplate: e.target.checked }))}
            />
            Save as Template (for reuse with other clients)
          </label>
        </div>

        {formData.isTemplate && (
          <div className="form-group">
            <label htmlFor="templateName">Template Name *</label>
            <input
              type="text"
              id="templateName"
              name="templateName"
              value={formData.templateName}
              onChange={handleInputChange}
              placeholder="e.g., Beginner Strength Program, Advanced Hypertrophy"
              required
            />
            <small>This name will be used to identify the template in your program bank</small>
          </div>
        )}

        {!formData.isTemplate && (
          <div className="form-group">
            <label htmlFor="client">Assign to Client (Optional)</label>
            <select
              id="client"
              name="client"
              value={formData.client}
              onChange={handleInputChange}
            >
              <option value="">Create program without client assignment</option>
              {clients.map(client => (
                <option key={client._id} value={client._id}>
                  {client.username} ({client.email})
                </option>
              ))}
            </select>
            <small>If no client is selected, the program will be saved in your program history</small>
          </div>
        )}

        <div className="program-schedule">
          <h3>Program Schedule</h3>
          <p>Assign workouts to each workout of your program:</p>
          
          {/* Week Tabs */}
          <div className="week-tabs">
            {formData.weeks.map((week, weekIndex) => (
              <button
                key={weekIndex}
                type="button"
                className={`week-tab ${activeTab === week.weekNumber ? 'active' : ''}`}
                onClick={() => setActiveTab(week.weekNumber)}
              >
                Week {week.weekNumber}
              </button>
            ))}
          </div>

          {/* Week Content */}
          {formData.weeks.map((week, weekIndex) => (
            <div
              key={weekIndex}
              className={`week-content ${activeTab === week.weekNumber ? 'active' : ''}`}
            >
              <div className="week-header">
                <h4>Week {week.weekNumber}</h4>
                <div className="week-actions">
                  <button
                    type="button"
                    onClick={() => copyWeek(weekIndex)}
                    className="copy-btn"
                  >
                    Copy Week
                  </button>
                  {showPasteOption && (
                    <button
                      type="button"
                      onClick={() => pasteWeek(weekIndex)}
                      className="paste-btn"
                    >
                      Paste Week
                    </button>
                  )}
                </div>
              </div>

              <div className="workout-grid">
                {week.workouts.map((day, dayIndex) => (
                  <div key={dayIndex} className="workout-day">
                    <div className="workout-header">
                      <h5>Workout {day.day}</h5>
                      <div className="workout-actions">
                        {day.workout || day.isInlineWorkout ? (
                          <button
                            type="button"
                            onClick={() => removeWorkoutFromDay(weekIndex, dayIndex)}
                            className="remove-btn"
                          >
                            Remove
                          </button>
                        ) : (
                          <select
                            value=""
                            onChange={(e) => assignWorkoutToDay(weekIndex, dayIndex, e.target.value)}
                            className="workout-select"
                          >
                            <option value="">Select workout...</option>
                            <option value="create-inline">Create new workout</option>
                            {availableWorkouts.map(workout => (
                              <option key={workout._id} value={workout._id}>
                                {workout.name}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>

                    {day.workout && (
                      <div className="assigned-workout">
                        <h6>{day.workout.name}</h6>
                        <p>{day.workout.description}</p>
                        <div className="exercise-list">
                          {day.workout.exercises.map((exercise, index) => (
                            <div key={index} className="exercise-item">
                              <span className="exercise-name">{exercise.exercise.name}</span>
                              <span className="exercise-details">
                                {exercise.sets} sets × {exercise.reps} reps
                                {exercise.weight && ` @ ${exercise.weight}kg`}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {day.isInlineWorkout && (
                      <div className="inline-workout">
                        <div className="inline-workout-header">
                          <h6>Custom Workout</h6>
                          <button
                            type="button"
                            onClick={() => addExerciseToInlineWorkout(weekIndex, dayIndex)}
                            className="add-exercise-btn"
                          >
                            + Add Exercise
                          </button>
                        </div>

                        {day.inlineExercises.length === 0 ? (
                          <p className="no-exercises">No exercises added yet. Click "Add Exercise" to start.</p>
                        ) : (
                          <div className="exercise-list">
                            {day.inlineExercises.map((exercise, exerciseIndex) => (
                              <div key={exerciseIndex} className="exercise-item">
                                <div className="exercise-row">
                                  <select
                                    value={exercise.exercise}
                                    onChange={(e) => updateInlineExercise(weekIndex, dayIndex, exerciseIndex, 'exercise', e.target.value)}
                                    className="exercise-select"
                                    required
                                  >
                                    <option value="">Select exercise...</option>
                                    {availableExercises.map(ex => (
                                      <option key={ex._id} value={ex._id}>
                                        {ex.name}
                                      </option>
                                    ))}
                                  </select>
                                  
                                  <input
                                    type="number"
                                    value={exercise.sets}
                                    onChange={(e) => updateInlineExercise(weekIndex, dayIndex, exerciseIndex, 'sets', parseInt(e.target.value))}
                                    placeholder="Sets"
                                    min="1"
                                    className="exercise-input"
                                  />
                                  
                                  <input
                                    type="number"
                                    value={exercise.reps}
                                    onChange={(e) => updateInlineExercise(weekIndex, dayIndex, exerciseIndex, 'reps', parseInt(e.target.value))}
                                    placeholder="Reps"
                                    min="1"
                                    className="exercise-input"
                                  />
                                  
                                  <input
                                    type="number"
                                    value={exercise.weight}
                                    onChange={(e) => updateInlineExercise(weekIndex, dayIndex, exerciseIndex, 'weight', e.target.value)}
                                    placeholder="Weight (kg)"
                                    className="exercise-input"
                                  />
                                  
                                  <input
                                    type="number"
                                    value={exercise.restTime}
                                    onChange={(e) => updateInlineExercise(weekIndex, dayIndex, exerciseIndex, 'restTime', parseInt(e.target.value))}
                                    placeholder="Rest (sec)"
                                    min="0"
                                    className="exercise-input"
                                  />
                                  
                                  <button
                                    type="button"
                                    onClick={() => removeInlineExercise(weekIndex, dayIndex, exerciseIndex)}
                                    className="remove-exercise-btn"
                                  >
                                    ×
                                  </button>
                                </div>
                                
                                <textarea
                                  value={exercise.notes}
                                  onChange={(e) => updateInlineExercise(weekIndex, dayIndex, exerciseIndex, 'notes', e.target.value)}
                                  placeholder="Notes (optional)"
                                  className="exercise-notes"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <textarea
                      value={day.notes}
                      onChange={(e) => updateDayNotes(weekIndex, dayIndex, e.target.value)}
                      placeholder="Workout notes (optional)"
                      className="workout-notes"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="form-actions">
          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Creating...' : formData.isTemplate ? 'Save as Template' : 'Create Program'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateProgram; 