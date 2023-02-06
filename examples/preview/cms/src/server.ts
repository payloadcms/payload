import path from 'path';
import express from 'express';
import payload from 'payload';
import { seed } from './seed';

require('dotenv').config({
  path: path.resolve(__dirname, '../.env'),
});

const app = express();

// Redirect root to Admin panel
app.get('/', (_, res) => {
  res.redirect('/admin');
});

const start = async () => {
  await payload.init({
    secret: process.env.PAYLOAD_SECRET,
    mongoURL: process.env.MONGODB_URI,
    express: app,
    onInit: () => {
      payload.logger.info(`Payload Admin URL: ${payload.getAdminURL()}`);
    },
  });

  if (process.env.PAYLOAD_SEED === 'true') {
    payload.logger.info('---- SEEDING DATABASE ----');
    await seed(payload);
  }

  app.listen(8000);
};

start();
