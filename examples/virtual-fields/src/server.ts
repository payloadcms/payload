import express from 'express';
import payload from 'payload';
import path from 'path';
import { seedData } from './seed';

require('dotenv').config({
  path: path.resolve(__dirname, '../.env'),
});

const app = express();

// Redirect all traffic at root to admin UI
app.get('/', (_, res) => {
  res.redirect('/admin');
});

const start = async () => {
  // Initialize Payload
  await payload.init({
    secret: process.env.PAYLOAD_SECRET,
    mongoURL: process.env.MONGODB_URI,
    express: app,
    onInit: async () => {
      payload.logger.info(`Payload Admin URL: ${payload.getAdminURL()}`);
    },
  });

  if (process.env.PAYLOAD_PUBLIC_SEED === 'true') {
    payload.logger.info('---- SEEDING DATABASE ----');
    await seedData();
    payload.logger.info('---- SEED COMPLETE ----');
  }

  app.listen(3000);
};

start();
