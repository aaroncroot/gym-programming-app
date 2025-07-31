import React, { useState, useEffect } from 'react';
import axios from 'axios';

function CreateProgram({ user, onBack }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    client: '',
    workoutsPerWeek: 3,
    duration: 4,
    weeks: []
  });
  
  const [availableWorkouts, setAvailableWorkouts] = useState([]);
  const [availableExercises, setAvailableExercises] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(1);
  const [savingWorkout, setSavingWorkout] = useState(null);
  const [copiedWeek, setCopiedWeek] = useState(null);
  const [showPasteOption, setShowPasteOption] = useState(false);

  useEffect(() => {
    fetchWorkouts();
    fetchExercises();
    fetchClients();
  }, []);

  // Generate weeks structure when workoutsPerWeek or duration changes
  useEffect(() => {
    generateWeeksStructure();
  }, [formData.workoutsPerWeek, formData.duration]);

  const fetchWorkouts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/workouts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setAvailableWorkouts(response.data.data || []);
      } else {
        setAvailableWorkouts([]);
      }
    } catch (error) {
      console.error('Error fetching workouts:', error);
      setAvailableWorkouts([]);
    }
  };

  const fetchExercises = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/exercises', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
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

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/auth/users/clients', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setClients(response.data.data || []);
      } else {
        setClients([]);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      setClients([]);
    }
  };

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
                      inlineExercises: [...day.inlineExercises, {
                        exercise: '',
                        sets: 3,
                        reps: 10,
                        weight: 0,
                        duration: 0,
                        restTime: 60,
                        notes: ''
                      }]
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
                      inlineExercises: day.inlineExercises.map((exercise, eIndex) => 
                        eIndex === exerciseIndex 
                          ? { ...exercise, [field]: value }
                          : exercise
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
                      inlineExercises: day.inlineExercises.filter((_, eIndex) => eIndex !== exerciseIndex)
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

  const saveInlineWorkout = async (weekIndex, dayIndex) => {
    const day = formData.weeks[weekIndex].workouts[dayIndex];
    
    if (!day.isInlineWorkout || day.inlineExercises.length === 0) {
      return;
    }

    // Validate that all exercises have been selected
    const hasEmptyExercises = day.inlineExercises.some(ex => !ex.exercise);
    if (hasEmptyExercises) {
      setError('Please select an exercise for all exercise items');
      return;
    }

    setSavingWorkout(`${weekIndex}-${dayIndex}`);

    try {
      const token = localStorage.getItem('token');
      
      const workoutData = {
        name: `Workout ${day.day} - Week ${weekIndex + 1}`,
        description: `Inline workout created in program`,
        exercises: day.inlineExercises.map(ex => ({
          exercise: ex.exercise,
          sets: ex.sets,
          reps: ex.reps,
          weight: ex.weight,
          duration: ex.duration,
          restTime: ex.restTime,
          notes: ex.notes
        }))
      };

      const response = await axios.post('http://localhost:5000/api/workouts', workoutData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        // Keep the inline workout visible but mark it as saved
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
                          isInlineWorkout: true,
                          isSaved: true,
                          savedWorkoutId: response.data.data._id
                        }
                      : day
                  )
                }
              : week
          )
        }));
        
        // Refresh available workouts
        await fetchWorkouts();
      } else {
        setError(response.data.message || 'Failed to save workout');
      }
    } catch (error) {
      console.error('Error saving workout:', error);
      setError(error.response?.data?.message || 'Failed to save workout');
    } finally {
      setSavingWorkout(null);
    }
  };

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
              // Create inline workout data
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
        name: formData.name,
        description: formData.description,
        client: formData.client || null,
        workoutsPerWeek: formData.workoutsPerWeek,
        duration: formData.duration,
        workouts: workouts
      };

      const response = await axios.post('http://localhost:5000/api/programs', programData, {
        headers: { Authorization: `Bearer ${token}` }
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

        <div className="form-group">
          <label htmlFor="client">Assign to Client (Optional)</label>
          <select
            id="client"
            name="client"
            value={formData.client}
            onChange={handleInputChange}
          >
            <option value="">Create as template (no client assigned)</option>
            {clients.map(client => (
              <option key={client._id} value={client._id}>
                {client.username} ({client.email})
              </option>
            ))}
          </select>
        </div>

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
            {showPasteOption && copiedWeek && (
              <button
                type="button"
                className="paste-tab"
                onClick={() => pasteWeek(activeTab - 1)}
              >
                📋 Paste Week {copiedWeek.weekNumber}
              </button>
            )}
          </div>

          {/* Week Content */}
          {formData.weeks.map((week, weekIndex) => (
            <div 
              key={weekIndex} 
              className={`week-content ${activeTab === week.weekNumber ? 'active' : ''}`}
            >
              <div className="week-header">
                <h4>Week {week.weekNumber}</h4>
                <button
                  type="button"
                  className="copy-btn"
                  onClick={() => copyWeek(weekIndex)}
                >
                  📋 Copy Week
                </button>
              </div>
              
              <div className="week-workouts">
                {week.workouts.map((day, dayIndex) => (
                  <div key={dayIndex} className="day-workout">
                    <div className="day-header">
                      <h5>Workout {day.day}</h5>
                      {(day.workout || day.isInlineWorkout) && (
                        <button
                          type="button"
                          onClick={() => removeWorkoutFromDay(weekIndex, dayIndex)}
                          className="remove-btn"
                        >
                          ×
                        </button>
                      )}
                    </div>
                    
                    <div className="workout-assignment">
                      <select
                        value={day.workout ? day.workout._id : (day.isInlineWorkout ? 'create-inline' : '')}
                        onChange={(e) => assignWorkoutToDay(weekIndex, dayIndex, e.target.value)}
                      >
                        <option value="">Select a workout...</option>
                        <option value="create-inline">➕ Create New Workout</option>
                        {availableWorkouts.map(workout => (
                          <option key={workout._id} value={workout._id}>
                            {workout.name}
                          </option>
                        ))}
                      </select>
                      
                      {day.workout && (
                        <div className="assigned-workout">
                          <strong>Assigned: {day.workout.name}</strong>
                          <textarea
                            placeholder="Notes for this workout..."
                            value={day.notes}
                            onChange={(e) => updateDayNotes(weekIndex, dayIndex, e.target.value)}
                            rows="2"
                          />
                        </div>
                      )}

                      {day.isInlineWorkout && (
                        <div className="inline-workout">
                          <div className="inline-workout-header">
                            <strong>
                              Creating New Workout
                              {day.isSaved && <span className="saved-badge"> ✓ Saved</span>}
                            </strong>
                            <div className="inline-workout-actions">
                              <button
                                type="button"
                                onClick={() => addExerciseToInlineWorkout(weekIndex, dayIndex)}
                                className="add-exercise-btn"
                              >
                                + Add Exercise
                              </button>
                              {!day.isSaved && (
                                <button
                                  type="button"
                                  onClick={() => saveInlineWorkout(weekIndex, dayIndex)}
                                  disabled={savingWorkout === `${weekIndex}-${dayIndex}`}
                                  className="save-workout-btn"
                                >
                                  {savingWorkout === `${weekIndex}-${dayIndex}` ? 'Saving...' : '💾 Save Workout'}
                                </button>
                              )}
                            </div>
                          </div>
                          
                          {day.inlineExercises.map((exercise, exerciseIndex) => (
                            <div key={exerciseIndex} className="inline-exercise">
                              <div className="exercise-header">
                                <h6>Exercise {exerciseIndex + 1}</h6>
                                <button
                                  type="button"
                                  onClick={() => removeInlineExercise(weekIndex, dayIndex, exerciseIndex)}
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
                                    onChange={(e) => updateInlineExercise(weekIndex, dayIndex, exerciseIndex, 'exercise', e.target.value)}
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
                                      onChange={(e) => updateInlineExercise(weekIndex, dayIndex, exerciseIndex, 'sets', parseInt(e.target.value))}
                                      min="1"
                                      required
                                    />
                                  </div>

                                  <div className="form-group">
                                    <label>Reps *</label>
                                    <input
                                      type="number"
                                      value={exercise.reps}
                                      onChange={(e) => updateInlineExercise(weekIndex, dayIndex, exerciseIndex, 'reps', parseInt(e.target.value))}
                                      min="1"
                                      required
                                    />
                                  </div>

                                  <div className="form-group">
                                    <label>Weight (kg)</label>
                                    <input
                                      type="number"
                                      value={exercise.weight}
                                      onChange={(e) => updateInlineExercise(weekIndex, dayIndex, exerciseIndex, 'weight', parseFloat(e.target.value) || 0)}
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
                                      onChange={(e) => updateInlineExercise(weekIndex, dayIndex, exerciseIndex, 'duration', parseInt(e.target.value) || 0)}
                                      min="0"
                                    />
                                  </div>

                                  <div className="form-group">
                                    <label>Rest Time (seconds)</label>
                                    <input
                                      type="number"
                                      value={exercise.restTime}
                                      onChange={(e) => updateInlineExercise(weekIndex, dayIndex, exerciseIndex, 'restTime', parseInt(e.target.value) || 60)}
                                      min="0"
                                    />
                                  </div>
                                </div>

                                <div className="form-group">
                                  <label>Notes</label>
                                  <textarea
                                    value={exercise.notes}
                                    onChange={(e) => updateInlineExercise(weekIndex, dayIndex, exerciseIndex, 'notes', e.target.value)}
                                    rows="2"
                                    placeholder="Any additional notes for this exercise..."
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          <textarea
                            placeholder="Notes for this workout..."
                            value={day.notes}
                            onChange={(e) => updateDayNotes(weekIndex, dayIndex, e.target.value)}
                            rows="2"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="form-actions">
          <button type="button" onClick={onBack} className="cancel-btn">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Creating...' : 'Create Program'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateProgram; 