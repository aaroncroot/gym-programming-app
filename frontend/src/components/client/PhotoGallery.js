import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './PhotoGallery.css';

const PhotoGallery = ({ user }) => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/photos/user/${user._id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setPhotos(response.data.data);
    } catch (error) {
      console.error('Error fetching photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPhotos = selectedCategory === 'all' 
    ? photos 
    : photos.filter(photo => photo.category === selectedCategory);

  const categories = [
    { value: 'all', label: 'All Photos' },
    { value: 'before', label: 'Before Photos' },
    { value: 'after', label: 'After Photos' },
    { value: 'workout', label: 'Workout Photos' },
    { value: 'progress', label: 'Progress Photos' }
  ];

  return (
    <div className="photo-gallery">
      <div className="gallery-header">
        <h2>�� My Photo Gallery</h2>
        <button 
          className="upload-btn"
          onClick={() => setShowUploadModal(true)}
        >
          �� Add Photos
        </button>
      </div>

      <div className="category-filter">
        {categories.map(category => (
          <button
            key={category.value}
            className={`category-btn ${selectedCategory === category.value ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category.value)}
          >
            {category.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading">Loading photos...</div>
      ) : (
        <div className="photo-grid">
          {filteredPhotos.map(photo => (
            <div key={photo._id} className="photo-item">
              <img src={photo.thumbnailUrl} alt={photo.description} />
              <div className="photo-overlay">
                <div className="photo-info">
                  <span className="photo-date">
                    {new Date(photo.createdAt).toLocaleDateString()}
                  </span>
                  {photo.workoutTitle && (
                    <span className="workout-title">{photo.workoutTitle}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredPhotos.length === 0 && !loading && (
        <div className="empty-gallery">
          <div className="empty-icon">��</div>
          <h3>No Photos Yet</h3>
          <p>Start adding photos to track your progress!</p>
        </div>
      )}
    </div>
  );
};

export default PhotoGallery; 