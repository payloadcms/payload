/* eslint-disable no-console */
import express from 'express';
import payload from '../../src';

const expressApp = express();

const init = async () => {
  await payload.init({
    secret: 'SECRET_KEY',
    mongoURL: process.env.MONGO_URL || 'mongodb://localhost/payload',
    express: expressApp,
    email: {
      logMockCredentials: true,
      fromName: 'Payload',
      fromAddress: 'hello@payloadcms.com',
    },
    onInit: async (app) => {
      app.logger.info('Payload Dev Server Initialized');
    },
  });

  const externalRouter = express.Router();

  externalRouter.use(payload.authenticate);

  expressApp.listen(3000, async () => {
    payload.logger.info(`Admin URL on ${payload.getAdminURL()}`);
    payload.logger.info(`API URL on ${payload.getAPIURL()}`);
  });
};

init();
