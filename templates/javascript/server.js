const express = require('express');
const payload = require('@payloadcms/payload');
const app = express();

// Initialize Payload
payload.init({
  secret: 'SECRET_KEY',
  mongoURL: 'mongodb://localhost/payload-starter',
  express: app,
});

// Add your own express routes here

app.listen(3000, async () => {
  console.log('Payload running on port 3000');
});