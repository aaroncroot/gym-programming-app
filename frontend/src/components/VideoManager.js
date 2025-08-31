import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

function VideoManager({ user, onClose }) {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [editingExercise, setEditingExercise] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/exercises`);
        setExercises(response.data.exercises || []);
      } catch (error) {
        console.error('Error fetching exercises:', error);
      }
    };
  }, []);

  const handleVideoUpdate = async (exerciseId, videoUrl) => {
    try {
      setIsUpdating(true);
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE_URL}/api/exercises/${exerciseId}`, {
        videoUrl: videoUrl
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update the exercise in the local state
      setExercises(exercises.map(ex => 
        ex._id === exerciseId 
          ? { ...ex, videoUrl: videoUrl }
          : ex
      ));
      
      setEditingExercise(null);
      setVideoUrl('');
    } catch (error) {
      console.error('Error updating video:', error);
      alert('Failed to update video URL');
    } finally {
      setIsUpdating(false);
    }
  };

  const startEditing = (exercise) => {
    setEditingExercise(exercise._id);
    setVideoUrl(exercise.videoUrl || '');
  };

  const cancelEditing = () => {
    setEditingExercise(null);
    setVideoUrl('');
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

  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = !searchTerm || 
      exercise.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || exercise.category === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="video-manager-modal">
        <div className="modal-content">
          <div className="loading">Loading exercises...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="video-manager-modal">
      <div className="modal-content large-modal">
        <div className="modal-header">
          <h3>Video Manager</h3>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        <div className="video-manager-filters">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search exercises..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
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
        </div>

        <div className="video-manager-stats">
          <div className="stat-item">
            <span className="stat-number">{exercises.filter(ex => ex.videoUrl).length}</span>
            <span className="stat-label">With Videos</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{exercises.filter(ex => !ex.videoUrl).length}</span>
            <span className="stat-label">Without Videos</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{exercises.length}</span>
            <span className="stat-label">Total Exercises</span>
          </div>
        </div>

        <div className="video-manager-list">
          {filteredExercises.length === 0 ? (
            <div className="no-exercises">
              <p>No exercises found matching your criteria.</p>
            </div>
          ) : (
            filteredExercises.map(exercise => (
              <div key={exercise._id} className="video-manager-item">
                <div className="exercise-info">
                  <h4>{exercise.name}</h4>
                  <div className="exercise-meta">
                    <span className="category">{exercise.category}</span>
                    <span className="muscle-group">{exercise.muscleGroup}</span>
                    <span className="equipment">{exercise.equipment}</span>
                  </div>
                </div>

                <div className="video-status">
                  {exercise.videoUrl ? (
                    <div className="video-preview">
                      {getYouTubeEmbedUrl(exercise.videoUrl) ? (
                        <iframe
                          width="120"
                          height="90"
                          src={getYouTubeEmbedUrl(exercise.videoUrl)}
                          title={exercise.name}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      ) : (
                        <div className="video-link-preview">
                          <a href={exercise.videoUrl} target="_blank" rel="noopener noreferrer">
                            📹 External Link
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="no-video-indicator">
                      <span>No Video</span>
                    </div>
                  )}
                </div>

                <div className="video-actions">
                  {editingExercise === exercise._id ? (
                    <div className="video-edit-form">
                      <input
                        type="text"
                        placeholder="Enter YouTube URL..."
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        className="video-url-input"
                      />
                      <div className="edit-buttons">
                        <button 
                          onClick={() => handleVideoUpdate(exercise._id, videoUrl)}
                          disabled={isUpdating}
                          className="save-btn"
                        >
                          {isUpdating ? 'Saving...' : 'Save'}
                        </button>
                        <button 
                          onClick={cancelEditing}
                          className="cancel-btn"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => startEditing(exercise)}
                      className="edit-video-btn"
                    >
                      {exercise.videoUrl ? 'Edit Video' : 'Add Video'}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default VideoManager; 