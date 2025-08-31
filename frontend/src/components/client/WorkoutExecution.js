import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './WorkoutExecution.css';
import { API_BASE_URL } from '../../config';

const WorkoutExecution = ({ workout, onComplete, onBack }) => {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [exerciseData, setExerciseData] = useState(null);
  const [previousResults, setPreviousResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [completedExercises, setCompletedExercises] = useState([]);
  const [currentSet, setCurrentSet] = useState(1);
  const [restTime, setRestTime] = useState(0);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [setData, setSetData] = useState({});
  const videoRef = useRef(null);
  const restTimerRef = useRef(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [exerciseHistory, setExerciseHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(0);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackPhotos, setFeedbackPhotos] = useState([]);
  const [uploadingFeedbackPhotos, setUploadingFeedbackPhotos] = useState(false);
  const feedbackFileInputRef = useRef(null);

  useEffect(() => {
    if (workout && workout.exercises && workout.exercises.length > 0) {
      fetchExerciseData(workout.exercises[0].exercise);
    }
  }, [workout]);

  useEffect(() => {
    if (currentExerciseIndex < workout?.exercises?.length) {
      fetchExerciseData(workout.exercises[currentExerciseIndex].exercise);
    }
  }, [currentExerciseIndex, workout]);

  useEffect(() => {
    if (showRestTimer && restTime > 0) {
      restTimerRef.current = setInterval(() => {
        setRestTime(prev => {
          if (prev <= 1) {
            setShowRestTimer(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (restTimerRef.current) {
        clearInterval(restTimerRef.current);
      }
    };
  }, [showRestTimer, restTime]);

  const fetchExerciseData = async (exerciseId) => {
    try {
      setLoading(true);
      const [exerciseResponse, resultsResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/exercises/${exerciseId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        axios.get(`${API_BASE_URL}/api/workouts/progress/${exerciseId}?limit=2`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
      ]);
      
      setExerciseData(exerciseResponse.data.data);
      setPreviousResults(resultsResponse.data.data || []);
    } catch (error) {
      console.error('Error fetching exercise data:', error);
      setError('Failed to load exercise data');
    } finally {
      setLoading(false);
    }
  };

  const fetchExerciseHistory = async (exerciseId) => {
    try {
      setLoadingHistory(true);
      const response = await axios.get(`${API_BASE_URL}/api/workouts/progress/${exerciseId}?limit=50`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setExerciseHistory(response.data.data || []);
    } catch (error) {
      console.error('Error fetching exercise history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleVideoPlay = () => {
    setIsPlaying(true);
  };

  const handleVideoPause = () => {
    setIsPlaying(false);
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
  };

  const handleSetDataChange = (setNumber, field, value) => {
    setSetData(prev => ({
      ...prev,
      [setNumber]: {
        ...prev[setNumber],
        [field]: value
      }
    }));
  };

  const handleSetComplete = () => {
    const currentExercise = workout.exercises[currentExerciseIndex];
    const totalSets = currentExercise.sets;
    
    if (currentSet < totalSets) {
      setCurrentSet(currentSet + 1);
      // Only show rest timer if trainer set a rest time
      if (currentExercise.restTime && currentExercise.restTime > 0) {
        setRestTime(currentExercise.restTime);
        setShowRestTimer(true);
      }
    } else {
      // Exercise completed
      setCompletedExercises(prev => [...prev, currentExerciseIndex]);
      setCurrentSet(1);
      setSetData({}); // Reset set data for next exercise
      
      if (currentExerciseIndex < workout.exercises.length - 1) {
        // Move to next exercise
        setCurrentExerciseIndex(currentExerciseIndex + 1);
      } else {
        // Workout completed
        handleWorkoutComplete();
      }
    }
  };

  const handleWorkoutComplete = async () => {
    try {
      // Log workout completion with set data
      await axios.post(`${API_BASE_URL}/api/workouts/log`, {
        workoutId: workout._id,
        exercises: workout.exercises.map((exercise, index) => ({
          exerciseId: exercise.exercise,
          sets: Object.keys(setData).filter(key => key.startsWith(`${index}-`)).map(setKey => ({
            setNumber: parseInt(setKey.split('-')[1]),
            weight: setData[setKey]?.weight || 0,
            reps: setData[setKey]?.reps || exercise.reps,
            completed: completedExercises.includes(index)
          })),
          completed: completedExercises.includes(index)
        })),
        completedAt: new Date()
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      // Show feedback modal instead of immediately completing
      setShowFeedbackModal(true);
    } catch (error) {
      console.error('Error logging workout:', error);
    }
  };

  const submitFeedback = async () => {
    if (!feedback.trim()) {
      alert('Please provide feedback before submitting.');
      return;
    }

    try {
      setSubmittingFeedback(true);
      
      await axios.post(`${API_BASE_URL}/api/workouts/feedback`, {
        workoutId: workout._id,
        feedback: feedback.trim(),
        rating: rating > 0 ? rating : null
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      setShowFeedbackModal(false);
      onComplete && onComplete();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Error submitting feedback. Please try again.');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const skipFeedback = () => {
    setShowFeedbackModal(false);
    onComplete && onComplete();
  };

  const handleShowHistory = async () => {
    if (exerciseData) {
      await fetchExerciseHistory(exerciseData._id);
      setShowHistoryModal(true);
    }
  };

  const skipRest = () => {
    setShowRestTimer(false);
    setRestTime(0);
    if (restTimerRef.current) {
      clearInterval(restTimerRef.current);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getMuscleGroupIcon = (muscleGroup) => {
    const icons = {
      chest: '💪',
      back: '🏋️',
      shoulders: '💪',
      arms: '💪',
      legs: '🦵',
      core: '💪',
      'full-body': '🏋️‍♂️',
      cardio: '❤️'
    };
    return icons[muscleGroup] || '💪';
  };

  const handleFeedbackPhotoUpload = async (files) => {
    setUploadingFeedbackPhotos(true);
    
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('photo', file);
        formData.append('photoType', 'workout_session');
        formData.append('category', 'workout');
        formData.append('workoutId', workout._id);
        formData.append('workoutTitle', workout.name);
        formData.append('description', `Workout feedback photo - ${new Date().toLocaleDateString()}`);

        const response = await axios.post(`${API_BASE_URL}/api/photos/upload`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });

        return response.data.data;
      });

      const uploadedPhotos = await Promise.all(uploadPromises);
      setFeedbackPhotos(prev => [...prev, ...uploadedPhotos]);
      
    } catch (error) {
      console.error('Error uploading feedback photos:', error);
    } finally {
      setUploadingFeedbackPhotos(false);
    }
  };

  const handleFeedbackFileSelect = (event) => {
    const files = event.target.files;
    if (files.length > 0) {
      handleFeedbackPhotoUpload(files);
    }
  };

  if (loading) {
    return (
      <div className="workout-execution">
        <div className="loading-spinner">Loading workout...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="workout-execution">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  const currentExercise = workout?.exercises?.[currentExerciseIndex];
  const progress = ((currentExerciseIndex + 1) / workout?.exercises?.length) * 100;

  return (
    <div className="workout-execution">
      <div className="workout-header">
        <button className="btn-back" onClick={onBack}>
          ← Back to Programs
        </button>
        <h2>Workout Execution</h2>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        </div>
        <div className="progress-text">
          Exercise {currentExerciseIndex + 1} of {workout?.exercises?.length}
        </div>
      </div>

      {showRestTimer ? (
        <div className="rest-timer">
          <h3>Rest Time</h3>
          <div className="timer-display">{formatTime(restTime)}</div>
          <p>Take a break and prepare for your next set</p>
          <button className="btn-skip-rest" onClick={skipRest}>
            Skip Rest
          </button>
        </div>
      ) : (
        <div className="exercise-section">
          {exerciseData && (
            <>
              <div className="exercise-header">
                <h3>{exerciseData.name}</h3>
                <div className="exercise-meta">
                  <span className={`category ${exerciseData.category}`}>
                    {exerciseData.category}
                  </span>
                  <span className={`muscle-group ${exerciseData.muscleGroup}`}>
                    {exerciseData.muscleGroup}
                  </span>
                  <span className={`difficulty ${exerciseData.difficulty}`}>
                    {exerciseData.difficulty}
                  </span>
                </div>
              </div>

              <div className="exercise-content">
                <div className="video-section">
                  {exerciseData.videoUrl || exerciseData.videoFile ? (
                    <video
                      ref={videoRef}
                      className="exercise-video"
                      controls
                      onPlay={handleVideoPlay}
                      onPause={handleVideoPause}
                      onEnded={handleVideoEnd}
                    >
                      <source src={exerciseData.videoUrl || exerciseData.videoFile} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <div className="no-video">
                      <div className="no-video-icon">📹</div>
                      <p>No video available for this exercise</p>
                      <div className="exercise-image-fallback">
                        {exerciseData.imageUrl ? (
                          <img 
                            src={exerciseData.imageUrl} 
                            alt={exerciseData.name}
                            className="exercise-image"
                          />
                        ) : (
                          <div className="placeholder-image">
                            <span className="muscle-group-icon">
                              {getMuscleGroupIcon(exerciseData.muscleGroup)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="exercise-details">
                  <div className="instructions">
                    <h4>Instructions</h4>
                    <p>{exerciseData.instructions}</p>
                  </div>

                  <div className="previous-results">
                    <div className="results-header">
                      <h4>Previous Results</h4>
                      <button 
                        className="btn-history"
                        onClick={handleShowHistory}
                      >
                        View Full History
                      </button>
                    </div>
                    {previousResults.length > 0 ? (
                      <div className="results-list">
                        {previousResults.map((result, index) => (
                          <div key={index} className="result-item">
                            <div className="result-date">{formatDate(result._id)}</div>
                            <div className="result-sets">
                              {result.sets?.map((set, setIndex) => (
                                <span key={setIndex} className="set-result">
                                  {set.weight > 0 ? `${set.weight}kg` : 'BW'} × {set.reps}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="no-results">No previous attempts recorded</p>
                    )}
                  </div>

                  <div className="set-tracker">
                    <h4>Current Workout</h4>
                    <div className="workout-info">
                      <div className="info-item">
                        <span className="label">Sets:</span>
                        <span className="value">{currentExercise.sets}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Target Reps:</span>
                        <span className="value">{currentExercise.reps}</span>
                      </div>
                      {currentExercise.restTime > 0 && (
                        <div className="info-item">
                          <span className="label">Rest:</span>
                          <span className="value">{currentExercise.restTime}s</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="sets-input">
                      <h5>Set {currentSet} of {currentExercise.sets}</h5>
                      <div className="set-inputs">
                        <div className="input-group">
                          <label>Weight (kg):</label>
                          <input
                            type="number"
                            className="weight-input"
                            value={setData[`${currentExerciseIndex}-${currentSet}`]?.weight || ''}
                            onChange={(e) => handleSetDataChange(`${currentExerciseIndex}-${currentSet}`, 'weight', e.target.value)}
                            placeholder="0"
                            min="0"
                            step="0.5"
                          />
                        </div>
                        <div className="input-group">
                          <label>Reps:</label>
                          <input
                            type="number"
                            className="reps-input"
                            value={setData[`${currentExerciseIndex}-${currentSet}`]?.reps || ''}
                            onChange={(e) => handleSetDataChange(`${currentExerciseIndex}-${currentSet}`, 'reps', e.target.value)}
                            placeholder={currentExercise.reps}
                            min="0"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="exercise-actions">
                    <button 
                      className="btn-complete-set"
                      onClick={handleSetComplete}
                    >
                      Complete Set
                    </button>
                    <button 
                      className="btn-skip-exercise"
                      onClick={() => {
                        setCompletedExercises(prev => [...prev, currentExerciseIndex]);
                        setCurrentSet(1);
                        setSetData({});
                        if (currentExerciseIndex < workout.exercises.length - 1) {
                          setCurrentExerciseIndex(currentExerciseIndex + 1);
                        } else {
                          handleWorkoutComplete();
                        }
                      }}
                    >
                      Skip Exercise
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <div className="workout-summary">
        <h4>Workout Progress</h4>
        <div className="exercises-list">
          {workout?.exercises?.map((exercise, index) => (
            <div 
              key={index} 
              className={`exercise-item ${index === currentExerciseIndex ? 'current' : ''} ${completedExercises.includes(index) ? 'completed' : ''}`}
            >
              <span className="exercise-name">{exercise.name || `Exercise ${index + 1}`}</span>
              <span className="exercise-status">
                {completedExercises.includes(index) ? '✅' : index === currentExerciseIndex ? '🔄' : '⏳'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* History Modal */}
      {showHistoryModal && (
        <div className="history-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{exerciseData?.name} - Complete History</h3>
              <button 
                className="close-btn"
                onClick={() => setShowHistoryModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              {loadingHistory ? (
                <div className="loading-spinner">Loading history...</div>
              ) : exerciseHistory.length > 0 ? (
                <div className="history-list">
                  {exerciseHistory.map((result, index) => (
                    <div key={index} className="history-item">
                      <div className="history-date">
                        <strong>{formatDate(result._id)}</strong>
                        <span className="total-sets">{result.totalSets} sets</span>
                      </div>
                      
                      <div className="history-sets">
                        {result.sets?.map((set, setIndex) => (
                          <div key={setIndex} className="history-set">
                            <span className="set-number">Set {setIndex + 1}:</span>
                            <span className="set-details">
                              {set.weight > 0 ? `${set.weight}kg` : 'Bodyweight'} × {set.reps} reps
                            </span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="history-summary">
                        <span className="max-weight">
                          Max Weight: {result.maxWeight > 0 ? `${result.maxWeight}kg` : 'Bodyweight'}
                        </span>
                        <span className="max-reps">
                          Max Reps: {result.maxReps}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-history">
                  <div className="no-history-icon">📊</div>
                  <h4>No History Available</h4>
                  <p>Complete this exercise to start building your history!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Feedback Modal */}
      {showFeedbackModal && (
        <div className="feedback-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>🎉 Workout Complete!</h3>
              <p>Great job! How was your session?</p>
            </div>
            
            <div className="modal-body">
              <div className="rating-section">
                <label>Rate your workout (optional):</label>
                <div className="rating-stars">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      className={`star-btn ${star <= rating ? 'active' : ''}`}
                      onClick={() => setRating(star)}
                    >
                      {star <= rating ? '⭐' : '☆'}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="feedback-section">
                <label>Share your feedback with your trainer:</label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="How did the workout feel? Any issues or achievements you'd like to share?"
                  rows={4}
                  maxLength={1000}
                />
                <div className="char-count">
                  {feedback.length}/1000 characters
                </div>
              </div>

              {/* Photo upload section */}
              <div className="feedback-photos-section">
                <label>Add photos from your session (optional):</label>
                <div className="photo-upload-controls">
                  <button 
                    type="button"
                    className="photo-upload-btn"
                    onClick={() => feedbackFileInputRef.current?.click()}
                    disabled={uploadingFeedbackPhotos}
                  >
                    📸 Add Photos
                  </button>
                </div>

                {/* Uploaded photos preview */}
                {feedbackPhotos.length > 0 && (
                  <div className="feedback-photos-preview">
                    <h4>Session Photos ({feedbackPhotos.length})</h4>
                    <div className="photo-grid">
                      {feedbackPhotos.map((photo, index) => (
                        <div key={photo._id} className="photo-preview">
                          <img src={photo.thumbnailUrl} alt={`Feedback photo ${index + 1}`} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {uploadingFeedbackPhotos && (
                  <div className="upload-progress">
                    <div className="spinner"></div>
                    <span>Uploading photos...</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-actions">
              <button 
                className="btn-skip-feedback"
                onClick={skipFeedback}
                disabled={submittingFeedback}
              >
                Skip Feedback
              </button>
              <button 
                className="btn-submit-feedback"
                onClick={submitFeedback}
                disabled={submittingFeedback || !feedback.trim()}
              >
                {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </div>

            {/* Hidden file input for feedback photos */}
            <input
              type="file"
              ref={feedbackFileInputRef}
              onChange={handleFeedbackFileSelect}
              accept="image/*"
              multiple
              style={{ display: 'none' }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutExecution; 