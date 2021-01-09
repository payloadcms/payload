const express = require('express');
const payload = require('payload');

require('dotenv').config();
const app = express();

// Initialize Payload
payload.init({
  secret: process.env.PAYLOAD_SECRET,
  mongoURL: process.env.MONGODB_URI,
  express: app,
  onInit: () => {
    setTimeout(() => {
      payload.logger.info('');
      payload.logger.info(`Payload Admin URL: ${payload.getAdminURL()}`);
      payload.logger.info(`Payload API URL:   ${payload.getAPIURL()}`);
    }, 2000);
  },
});

// Add your own express routes here

app.listen(3000);