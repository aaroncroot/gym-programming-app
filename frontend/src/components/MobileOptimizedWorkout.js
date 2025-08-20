import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './MobileOptimizedWorkout.css';

const MobileOptimizedWorkout = ({ workout, onComplete, onBack }) => {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [showExerciseDetails, setShowExerciseDetails] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Handle orientation change
  useEffect(() => {
    const handleOrientationChange = () => {
      if (window.orientation === 90 || window.orientation === -90) {
        setIsFullscreen(true);
      } else {
        setIsFullscreen(false);
      }
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    return () => window.removeEventListener('orientationchange', handleOrientationChange);
  }, []);

  // Handle swipe gestures
  const handleSwipe = (direction) => {
    if (direction === 'left' && currentExerciseIndex < workout.exercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
    } else if (direction === 'right' && currentExerciseIndex > 0) {
      setCurrentExerciseIndex(prev => prev - 1);
    }
  };

  // Photo upload functions
  const handlePhotoUpload = async (files) => {
    setUploading(true);
    
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('photo', file);
        formData.append('photoType', 'workout_session');
        formData.append('category', 'workout');
        formData.append('workoutId', workout._id);
        formData.append('workoutTitle', workout.name);

        const response = await axios.post('/api/photos/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });

        return response.data.data;
      });

      const uploadedPhotos = await Promise.all(uploadPromises);
      setUploadedPhotos(prev => [...prev, ...uploadedPhotos]);
      
    } catch (error) {
      console.error('Error uploading photos:', error);
    } finally {
      setUploading(false);
    }
  };

  const openCamera = () => {
    cameraInputRef.current?.click();
  };

  const openGallery = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event) => {
    const files = event.target.files;
    if (files.length > 0) {
      handlePhotoUpload(files);
    }
  };

  const handleCameraCapture = (event) => {
    const files = event.target.files;
    if (files.length > 0) {
      handlePhotoUpload(files);
    }
  };

  return (
    <div className={`mobile-workout ${isFullscreen ? 'fullscreen' : ''}`}>
      {/* Mobile-optimized exercise navigation */}
      <div className="mobile-exercise-nav">
        <div className="exercise-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${((currentExerciseIndex + 1) / workout.exercises.length) * 100}%` }}
            />
          </div>
          <span className="exercise-counter">
            {currentExerciseIndex + 1} / {workout.exercises.length}
          </span>
        </div>
      </div>

      {/* Mobile-optimized exercise display */}
      <div className="mobile-exercise-content">
        <div className="exercise-swipe-area">
          <h2>{workout.exercises[currentExerciseIndex]?.name || 'Exercise'}</h2>
          
          {/* Photo upload section */}
          <div className="photo-upload-section">
            <button 
              className="photo-upload-btn"
              onClick={() => setShowPhotoUpload(!showPhotoUpload)}
            >
               Add Workout Photos
            </button>

            {showPhotoUpload && (
              <div className="photo-upload-options">
                <button 
                  className="camera-btn"
                  onClick={openCamera}
                  disabled={uploading}
                >
                  📷 Take Photo
                </button>
                <button 
                  className="gallery-btn"
                  onClick={openGallery}
                  disabled={uploading}
                >
                  🖼️ Choose from Gallery
                </button>
              </div>
            )}

            {/* Uploaded photos preview */}
            {uploadedPhotos.length > 0 && (
              <div className="uploaded-photos">
                <h4>Session Photos ({uploadedPhotos.length})</h4>
                <div className="photo-grid">
                  {uploadedPhotos.map((photo, index) => (
                    <div key={photo._id} className="photo-preview">
                      <img src={photo.thumbnailUrl} alt={`Workout photo ${index + 1}`} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {uploading && (
              <div className="upload-progress">
                <div className="spinner"></div>
                <span>Uploading photos...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        multiple
        style={{ display: 'none' }}
      />
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleCameraCapture}
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
      />

      {/* Mobile-optimized controls */}
      <div className="mobile-controls">
        <button 
          className="mobile-btn secondary"
          onClick={() => setShowExerciseDetails(!showExerciseDetails)}
        >
          {showExerciseDetails ? 'Hide' : 'Show'} Details
        </button>
        
        <button 
          className="mobile-btn primary"
          onClick={() => handleSwipe('left')}
          disabled={currentExerciseIndex >= workout.exercises.length - 1}
        >
          Next Exercise
        </button>
      </div>
    </div>
  );
};

export default MobileOptimizedWorkout; 