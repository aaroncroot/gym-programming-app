const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Import routes
const authRoutes = require('./routes/auth');
const exerciseRoutes = require('./routes/exercises');
const workoutRoutes = require('./routes/workouts');
const programRoutes = require('./routes/programs');
const uploadRoutes = require('./routes/upload');

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection with better error handling
console.log('Attempting to connect to MongoDB...');
console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Found' : 'Not found');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gym-app', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', (error) => {
  console.error('MongoDB connection error:', error);
  process.exit(1);
});

db.once('open', () => {
  console.log('✅ Connected to MongoDB successfully!');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/programs', programRoutes);
app.use('/api/upload', uploadRoutes);

// Add this line to serve uploaded files
app.use('/uploads', express.static('uploads'));

// Basic route
app.get('/api/health', (req, res) => {
  res.json({ message: 'Gym App API is running!' });
});

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Gym Programming App Backend' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(` Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Auth routes: http://localhost:${PORT}/api/auth`);
  console.log(`💪 Exercise routes: http://localhost:${PORT}/api/exercises`);
  console.log(`🏋️ Workout routes: http://localhost:${PORT}/api/workouts`);
  console.log(`📋 Program routes: http://localhost:${PORT}/api/programs`);
});