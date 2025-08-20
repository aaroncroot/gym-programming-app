const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const multer = require('multer');
const s3Service = require('../services/s3Service');
const config = require('../config/environment');

// Configure multer for memory storage (for S3 uploads)
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: function (req, file, cb) {
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const allowedVideoTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv'];
    
    if ([...allowedImageTypes, ...allowedVideoTypes].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only image and video files are allowed.'), false);
    }
  },
  limits: {
    fileSize: config.upload.maxFileSize
  }
});

// Upload photo with S3
router.post('/photo', auth, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'No photo file uploaded' 
      });
    }

    // Add user ID to file object for metadata
    req.file.userId = req.user.id;

    let processedFile = req.file;
    
    // Process images for optimization
    if (req.file.mimetype.startsWith('image/')) {
      const processedBuffer = await s3Service.processImage(req.file.buffer, {
        width: 800,
        height: 800,
        quality: 80
      });
      processedFile = {
        ...req.file,
        buffer: processedBuffer,
        size: processedBuffer.length
      };
    }

    // Upload to S3
    const uploadResult = await s3Service.uploadFile(processedFile, 'photos');
    
    res.json({
      success: true,
      message: 'Photo uploaded successfully to cloud storage',
      file: {
        key: uploadResult.key,
        url: uploadResult.url,
        size: uploadResult.size,
        mimetype: uploadResult.mimetype
      }
    });
  } catch (error) {
    console.error('Error uploading photo:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to upload photo to cloud storage' 
    });
  }
});

// Upload video with S3
router.post('/video', auth, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'No video file uploaded' 
      });
    }

    // Add user ID to file object for metadata
    req.file.userId = req.user.id;

    // Upload to S3 (videos are not processed, uploaded as-is)
    const uploadResult = await s3Service.uploadFile(req.file, 'videos');
    
    res.json({
      success: true,
      message: 'Video uploaded successfully to cloud storage',
      file: {
        key: uploadResult.key,
        url: uploadResult.url,
        size: uploadResult.size,
        mimetype: uploadResult.mimetype
      }
    });
  } catch (error) {
    console.error('Error uploading video:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to upload video to cloud storage' 
    });
  }
});

// Get signed URL for private file access
router.get('/access/:key', auth, async (req, res) => {
  try {
    const { key } = req.params;
    const signedUrl = await s3Service.getSignedUrl(key, 3600); // 1 hour expiry
    
    res.json({
      success: true,
      signedUrl,
      expiresIn: 3600
    });
  } catch (error) {
    console.error('Error generating signed URL:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to generate access URL' 
    });
  }
});

// Delete file from S3
router.delete('/:key', auth, async (req, res) => {
  try {
    const { key } = req.params;
    await s3Service.deleteFile(key);
    
    res.json({
      success: true,
      message: 'File deleted successfully from cloud storage'
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete file from cloud storage' 
    });
  }
});

module.exports = router;
