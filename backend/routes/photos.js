const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const { auth } = require('../middleware/auth');
const Photo = require('../models/Photo');
const User = require('../models/user');
const router = express.Router();

// Configure multer for photo uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Upload photo with automatic resizing and thumbnail generation
router.post('/upload', auth, upload.single('photo'), async (req, res) => {
  try {
    const { photoType, category, workoutId, workoutTitle, description, tags } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No photo uploaded' });
    }

    // Get user's trainer
    const user = await User.findById(req.user._id);
    const trainer = user.assignedTrainer;

    // Process image with sharp
    const imageBuffer = req.file.buffer;
    
    // Create main image (max 1200px width, maintain aspect ratio)
    const mainImage = await sharp(imageBuffer)
      .resize(1200, null, { withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();

    // Create thumbnail (300px width)
    const thumbnail = await sharp(imageBuffer)
      .resize(300, null, { withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();

    // Upload to cloud storage (you'll need to implement this)
    // For now, we'll use a placeholder
    const imageUrl = `https://your-storage.com/photos/${Date.now()}_main.jpg`;
    const thumbnailUrl = `https://your-storage.com/photos/${Date.now()}_thumb.jpg`;

    // Create photo record
    const photo = new Photo({
      user: req.user._id,
      trainer: trainer,
      photoType,
      category,
      workoutId: workoutId || null,
      workoutTitle: workoutTitle || null,
      imageUrl,
      thumbnailUrl,
      description: description || '',
      tags: tags ? tags.split(',').map(tag => tag.trim()) : []
    });

    await photo.save();

    res.json({
      success: true,
      data: photo
    });

  } catch (error) {
    console.error('Error uploading photo:', error);
    res.status(500).json({ success: false, message: 'Error uploading photo' });
  }
});

// Get user's photos
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { photoType, category, page = 1, limit = 20 } = req.query;

    // Verify user can access these photos
    if (req.user.role === 'client' && req.user._id.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    if (req.user.role === 'trainer') {
      const user = await User.findById(userId);
      if (!user || user.assignedTrainer?.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
    }

    const query = { user: userId };
    if (photoType) query.photoType = photoType;
    if (category) query.category = category;

    const photos = await Photo.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Photo.countDocuments(query);

    res.json({
      success: true,
      data: photos,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching photos:', error);
    res.status(500).json({ success: false, message: 'Error fetching photos' });
  }
});

// Delete photo
router.delete('/:photoId', auth, async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.photoId);
    
    if (!photo) {
      return res.status(404).json({ success: false, message: 'Photo not found' });
    }

    // Verify user can delete this photo
    if (req.user.role === 'client' && photo.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    if (req.user.role === 'trainer' && photo.trainer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    await Photo.findByIdAndDelete(req.params.photoId);

    res.json({ success: true, message: 'Photo deleted successfully' });

  } catch (error) {
    console.error('Error deleting photo:', error);
    res.status(500).json({ success: false, message: 'Error deleting photo' });
  }
});

module.exports = router; 