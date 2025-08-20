const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Import security middleware
const { 
  securityHeaders, 
  corsOptions, 
  productionRateLimit, 
  requestLogger, 
  errorHandler 
} = require('./middleware/security');

// Import new security routes
const apiKeyRoutes = require('./routes/apiKeys');
const securityRoutes = require('./routes/security');

const app = express();

// Import routes
const authRoutes = require('./routes/auth');
const exerciseRoutes = require('./routes/exercises');
const workoutRoutes = require('./routes/workouts');
const programRoutes = require('./routes/programs');
const uploadRoutes = require('./routes/upload');
const analyticsRoutes = require('./routes/analytics');
const messagesRoutes = require('./routes/messages');
const feedbackRoutes = require('./routes/feedback');

// Security middleware (apply before other middleware)
app.use(securityHeaders);
app.use(cors(corsOptions));
app.use(productionRateLimit);

// Request logging
app.use(requestLogger);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB connection with better error handling
console.log('Attempting to connect to MongoDB...');
console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Found' : 'Not found');
console.log('Environment:', process.env.NODE_ENV || 'development');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gym-app', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});

const db = mongoose.connection;
db.on('error', (error) => {
  console.error('MongoDB connection error:', error);
  process.exit(1);
});

db.once('open', () => {
  console.log('✅ Connected to MongoDB successfully!');
});

// Health check route (before other routes)
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'Gym App API is running!',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/programs', programRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/api-keys', apiKeyRoutes);

// Serve uploaded files (with security considerations)
app.use('/uploads', express.static('uploads', {
  setHeaders: (res, path) => {
    // Set security headers for uploaded files
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('X-Frame-Options', 'DENY');
  }
}));

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Gym Programming App Backend',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    status: 'running'
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(` Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Auth routes: http://localhost:${PORT}/api/auth`);
  console.log(`💪 Exercise routes: http://localhost:${PORT}/api/exercises`);
  console.log(`🏋️ Workout routes: http://localhost:${PORT}/api/workouts`);
  console.log(`📋 Program routes: http://localhost:${PORT}/api/programs`);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    mongoose.connection.close();
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    mongoose.connection.close();
    process.exit(0);
  });
});