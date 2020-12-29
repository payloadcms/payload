import express from 'express';
import payload from '@payloadcms/payload';

require('dotenv').config();
const app = express();

// Initialize Payload
payload.init({
  secret: process.env.PAYLOAD_SECRET,
  mongoURL: process.env.MONGODB_URI,
  express: app,
});

// Add your own express routes here

app.listen(3000, async () => {
  console.log('Payload running on port 3000');
});