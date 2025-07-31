import React, { useState } from 'react';
import axios from 'axios';

function ExerciseCard({ exercise, user, onUpdate }) {
  const [showDetails, setShowDetails] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditingVideo, setIsEditingVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState(exercise.videoUrl || '');
  const [isUpdatingVideo, setIsUpdatingVideo] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this exercise?')) {
      return;
    }

    try {
      setIsDeleting(true);
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/exercises/${exercise._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onUpdate();
    } catch (error) {
      console.error('Error deleting exercise:', error);
      alert('Failed to delete exercise');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleVideoUpdate = async () => {
    try {
      setIsUpdatingVideo(true);
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/exercises/${exercise._id}`, {
        videoUrl: videoUrl
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsEditingVideo(false);
      onUpdate(); // Refresh the exercise list
    } catch (error) {
      console.error('Error updating video:', error);
      alert('Failed to update video URL');
    } finally {
      setIsUpdatingVideo(false);
    }
  };

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(youtubeRegex);
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
    return null;
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return '#4CAF50';
      case 'intermediate': return '#FF9800';
      case 'advanced': return '#F44336';
      default: return '#666';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'strength': return '💪';
      case 'cardio': return '🏃';
      case 'flexibility': return '🧘';
      case 'balance': return '⚖️';
      case 'sports': return '⚽';
      default: return '🏋️';
    }
  };

  const embedUrl = getYouTubeEmbedUrl(exercise.videoUrl);

  return (
    <div className="exercise-card">
      <div className="exercise-header">
        <h3>{exercise.name}</h3>
        <div className="exercise-meta">
          <span className="category-icon">{getCategoryIcon(exercise.category)}</span>
          <span className="category">{exercise.category}</span>
          <span 
            className="difficulty"
            style={{ color: getDifficultyColor(exercise.difficulty) }}
          >
            {exercise.difficulty}
          </span>
        </div>
      </div>

      <div className="exercise-info">
        <p><strong>Muscle Group:</strong> {exercise.muscleGroup}</p>
        <p><strong>Equipment:</strong> {exercise.equipment}</p>
        {exercise.createdBy && (
          <p><strong>Created by:</strong> {exercise.createdBy.username}</p>
        )}
      </div>

      <div className="exercise-actions">
        <button 
          className="details-btn"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>
        
        {user?.role === 'trainer' && exercise.createdBy?._id === user.id && (
          <button 
            className="delete-btn"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        )}
      </div>

      {showDetails && (
        <div className="exercise-details">
          <h4>Instructions:</h4>
          <p>{exercise.instructions}</p>
          
          <div className="video-section">
            <h4>Video Demonstration:</h4>
            
            {user?.role === 'trainer' && exercise.createdBy?._id === user.id ? (
              // Trainer view - can edit video URL
              <div className="video-management">
                {isEditingVideo ? (
                  <div className="video-edit-form">
                    <input
                      type="text"
                      placeholder="Enter YouTube URL (e.g., https://www.youtube.com/watch?v=...)"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      className="video-url-input"
                    />
                    <div className="video-edit-buttons">
                      <button 
                        onClick={handleVideoUpdate}
                        disabled={isUpdatingVideo}
                        className="save-video-btn"
                      >
                        {isUpdatingVideo ? 'Saving...' : 'Save Video'}
                      </button>
                      <button 
                        onClick={() => {
                          setIsEditingVideo(false);
                          setVideoUrl(exercise.videoUrl || '');
                        }}
                        className="cancel-video-btn"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="video-display">
                    {embedUrl ? (
                      <div className="video-container">
                        <iframe
                          width="100%"
                          height="200"
                          src={embedUrl}
                          title={`${exercise.name} demonstration`}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      </div>
                    ) : exercise.videoUrl ? (
                      <div className="video-link">
                        <a href={exercise.videoUrl} target="_blank" rel="noopener noreferrer">
                          📹 Watch Video (External Link)
                        </a>
                      </div>
                    ) : (
                      <div className="no-video">
                        <p>No video available</p>
                      </div>
                    )}
                    <button 
                      onClick={() => setIsEditingVideo(true)}
                      className="edit-video-btn"
                    >
                      {exercise.videoUrl ? 'Edit Video' : 'Add Video'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // Client view - can only watch videos
              <div className="video-display">
                {embedUrl ? (
                  <div className="video-container">
                    <iframe
                      width="100%"
                      height="200"
                      src={embedUrl}
                      title={`${exercise.name} demonstration`}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                ) : exercise.videoUrl ? (
                  <div className="video-link">
                    <a href={exercise.videoUrl} target="_blank" rel="noopener noreferrer">
                      📹 Watch Video (External Link)
                    </a>
                  </div>
                ) : (
                  <div className="no-video">
                    <p>No video demonstration available</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ExerciseCard;
