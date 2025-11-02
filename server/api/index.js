// Vercel serverless function entry point
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || "https://my-apps-3y9m7qbfx-harshs-projects-d92d1860.vercel.app",
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting - More lenient for Vercel deployment
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // limit each IP to 300 requests per windowMs (more lenient for Vercel)
  message: {
    error: 'Too many requests, please try again later',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Auth-specific rate limiting (even more lenient)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 auth requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for token validation requests
    return req.method === 'GET' && req.path === '/api/auth/me';
  }
});

app.use('/api/', limiter);

// Routes
app.use('/api/auth', authLimiter, require('../routes/auth'));
app.use('/api/users', require('../routes/users'));
app.use('/api/issues', require('../routes/issues'));
app.use('/api/departments', require('../routes/departments'));
app.use('/api/admin', require('../routes/admin'));
app.use('/api/ai', require('../routes/ai'));
app.use('/api/chat', require('../routes/chat'));
app.use('/api/notifications', require('../routes/notifications'));
app.use('/api/rewards', require('../routes/rewards'));
app.use('/api/activity', require('../routes/activity'));
app.use('/api/community', require('../routes/community'));
app.use('/api/crowdfunding', require('../routes/crowdfunding'));
app.use('/api/funding', require('../routes/funding'));
app.use('/api/announcements', require('../routes/announcements'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Nivaran Platform API', 
    status: 'running',
    version: '1.0.0'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Database connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nivaran-platform';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err);
  }
};

connectDB();

module.exports = app;
