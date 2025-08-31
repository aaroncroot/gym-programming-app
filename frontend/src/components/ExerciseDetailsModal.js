import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

function ExerciseDetailsModal({ exercise, user, onClose, onExerciseUpdated }) {
  const [isEditingVideo, setIsEditingVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState(exercise.videoUrl || '');
  const [isUpdatingVideo, setIsUpdatingVideo] = useState(false);

  const handleVideoUpdate = async () => {
    try {
      setIsUpdatingVideo(true);
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_BASE_URL}/api/exercises/${exercise._id}`, {
        videoUrl: videoUrl
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update the exercise object with the new data
      Object.assign(exercise, response.data);
      
      setIsEditingVideo(false);
    } catch (error) {
      console.error('Error updating video:', error.response?.data || error.message);
      alert(`Failed to update video URL: ${error.response?.data?.message || error.message}`);
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

  const embedUrl = getYouTubeEmbedUrl(exercise.videoUrl);

  return (
    <div className="exercise-modal">
      <div className="exercise-modal-content">
        <div className="modal-header">
          <h3>{exercise.name}</h3>
          <button onClick={onClose} className="modal-close-btn">×</button>
        </div>
        <div className="exercise-details-content">
          <div className="meta-info">
            <div className="meta-item"><strong>Category:</strong> {exercise.category}</div>
            <div className="meta-item"><strong>Muscle Group:</strong> {exercise.muscleGroup}</div>
            <div className="meta-item"><strong>Equipment:</strong> {exercise.equipment}</div>
            <div className="meta-item"><strong>Difficulty:</strong> {exercise.difficulty}</div>
          </div>
          <h4>Instructions:</h4>
          <p>{exercise.instructions}</p>
          <div className="video-section">
            <h4>Video Demonstration:</h4>
            {user?.role === 'trainer' ? (
              <div className="video-management">
                {isEditingVideo ? (
                  <div className="video-edit-form">
                    <input
                      type="text"
                      placeholder="Enter YouTube URL"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      className="video-url-input"
                    />
                    <div className="video-edit-buttons">
                      <button onClick={handleVideoUpdate} disabled={isUpdatingVideo} className="save-video-btn">
                        {isUpdatingVideo ? 'Saving...' : 'Save Video'}
                      </button>
                      <button onClick={() => { setIsEditingVideo(false); setVideoUrl(exercise.videoUrl || ''); }} className="cancel-video-btn">
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
                    <button onClick={() => setIsEditingVideo(true)} className="edit-video-btn">
                      {exercise.videoUrl ? 'Edit Video' : 'Add Video'}
                    </button>
                  </div>
                )}
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
                    <p>No video demonstration available</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExerciseDetailsModal;
