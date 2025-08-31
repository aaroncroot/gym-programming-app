import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

function CreateExercise({ onClose, onExerciseCreated }) {
  const [formData, setFormData] = useState({
    name: '',
    category: 'strength',
    muscleGroup: 'chest',
    equipment: 'bodyweight',
    difficulty: 'beginner',
    instructions: '',
    videoUrl: '',
    isPublic: true,
    isPrivate: false
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (100MB limit)
      if (file.size > 100 * 1024 * 1024) {
        alert('File size must be less than 100MB');
        return;
      }
      setSelectedFile(file);
      setFormData(prev => ({ ...prev, videoUrl: '' })); // Clear URL if file selected
    }
  };

  const handleVideoUpload = async (file) => {
    const formData = new FormData();
    formData.append('video', file);

    try {
      setUploading(true);
      const response = await axios.post(`${API_BASE_URL}/api/upload/video`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setVideoUrl(response.data.videoPath);
      setUploading(false);
    } catch (error) {
      console.error('Error uploading video:', error);
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const exerciseData = {
        name: formData.name,
        category: formData.category,
        muscleGroup: formData.muscleGroup,
        equipment: formData.equipment,
        difficulty: formData.difficulty,
        videoUrl: videoUrl || formData.videoUrl, // Use uploaded video if available
        instructions: formData.instructions.split('\n').filter(instruction => instruction.trim()),
        isPublic: formData.isPublic,
        isPrivate: formData.isPrivate
      };

      await axios.post(`${API_BASE_URL}/api/exercises`, exerciseData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      onExerciseCreated();
      setFormData({
        name: '',
        category: 'strength',
        muscleGroup: 'chest',
        equipment: 'bodyweight',
        difficulty: 'beginner',
        instructions: '',
        videoUrl: '',
        isPublic: true,
        isPrivate: false
      });
      setSelectedFile(null);
      setVideoUrl('');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create exercise');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Create New Exercise</h3>
          <button onClick={onClose} className="modal-close-btn">×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="create-exercise-form">
          <div className="form-group">
            <label>Exercise Name:</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Category:</label>
              <select name="category" value={formData.category} onChange={handleInputChange}>
                <option value="strength">Strength</option>
                <option value="cardio">Cardio</option>
                <option value="flexibility">Flexibility</option>
                <option value="balance">Balance</option>
                <option value="sports">Sports</option>
              </select>
            </div>

            <div className="form-group">
              <label>Muscle Group:</label>
              <select name="muscleGroup" value={formData.muscleGroup} onChange={handleInputChange}>
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

          <div className="form-row">
            <div className="form-group">
              <label>Equipment:</label>
              <select name="equipment" value={formData.equipment} onChange={handleInputChange}>
                <option value="bodyweight">Bodyweight</option>
                <option value="dumbbells">Dumbbells</option>
                <option value="barbell">Barbell</option>
                <option value="machine">Machine</option>
                <option value="cable">Cable</option>
                <option value="kettlebell">Kettlebell</option>
                <option value="resistance-band">Resistance Band</option>
                <option value="cardio-machine">Cardio Machine</option>
                <option value="medicine-ball">Medicine Ball</option>
                <option value="stability-ball">Stability Ball</option>
                <option value="trx">TRX</option>
                <option value="bosu-trainer">BOSU Trainer</option>
                <option value="heavy-ropes">Heavy Ropes</option>
                <option value="pull-up-bar">Pull-up Bar</option>
                <option value="raised-platform-box">Raised Platform/Box</option>
              </select>
            </div>

            <div className="form-group">
              <label>Difficulty:</label>
              <select name="difficulty" value={formData.difficulty} onChange={handleInputChange}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Instructions:</label>
            <textarea
              name="instructions"
              value={formData.instructions}
              onChange={handleInputChange}
              required
              rows="4"
            />
          </div>

          <div className="form-group">
            <label>Video Options:</label>
            <div className="video-options">
              <div className="video-option">
                <label>
                  <input
                    type="radio"
                    name="videoType"
                    value="url"
                    checked={!selectedFile}
                    onChange={() => setSelectedFile(null)}
                  />
                  YouTube URL
                </label>
                <input
                  type="text"
                  name="videoUrl"
                  value={formData.videoUrl}
                  onChange={handleInputChange}
                  placeholder="https://www.youtube.com/watch?v=..."
                  disabled={selectedFile}
                />
              </div>
              
              <div className="video-option">
                <label>
                  <input
                    type="radio"
                    name="videoType"
                    value="file"
                    checked={!!selectedFile}
                    onChange={() => {}}
                  />
                  Upload Video File
                </label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileSelect}
                  disabled={!selectedFile && formData.videoUrl}
                />
                {selectedFile && (
                  <div className="file-info">
                    <span>{selectedFile.name}</span>
                    <span>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Access Settings:</label>
            <div className="access-options">
              <label>
                <input
                  type="checkbox"
                  name="isPublic"
                  checked={formData.isPublic}
                  onChange={handleInputChange}
                />
                Make exercise publicly available
              </label>
              <label>
                <input
                  type="checkbox"
                  name="isPrivate"
                  checked={formData.isPrivate}
                  onChange={handleInputChange}
                />
                Keep exercise private (only my clients can see)
              </label>
            </div>
          </div>

          {uploadProgress > 0 && (
            <div className="upload-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <span>{uploadProgress}% uploaded</span>
            </div>
          )}

          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="submit-btn">
              {isSubmitting ? 'Creating...' : 'Create Exercise'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateExercise;
