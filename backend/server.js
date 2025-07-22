const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

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
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
});