const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    service: 'Nivaran Backend'
  });
});

module.exports = app;
