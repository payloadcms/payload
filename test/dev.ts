import fs from 'fs';
import path from 'path';
import express from 'express';
import { v4 as uuid } from 'uuid';
import * as dotenv from 'dotenv';
import payload from '../src';

dotenv.config();

const [testSuiteDir] = process.argv.slice(2);

if (!testSuiteDir) {
  console.error('ERROR: You must provide an argument for "testSuiteDir"');
  process.exit(1);
}

const configPath = path.resolve(__dirname, testSuiteDir, 'config.ts');

if (!fs.existsSync(configPath)) {
  console.error('ERROR: You must pass a valid directory under test/ that contains a config.ts');
  process.exit(1);
}

process.env.PAYLOAD_CONFIG_PATH = configPath;

process.env.PAYLOAD_DROP_DATABASE = 'true';

const expressApp = express();

const startDev = async () => {
  await payload.init({
    secret: uuid(),
    mongoURL: 'mongodb://127.0.0.1/payload',
    express: expressApp,
    email: {
      logMockCredentials: true,
      fromName: 'Payload',
      fromAddress: 'hello@payloadcms.com',
    },
    onInit: async () => {
      payload.logger.info('Payload Dev Server Initialized');
    },
  });

  // Redirect root to Admin panel
  expressApp.get('/', (_, res) => {
    res.redirect('/admin');
  });

  const externalRouter = express.Router();

  externalRouter.use(payload.authenticate);

  expressApp.listen(3000, async () => {
    payload.logger.info(`Admin URL on http://localhost:3000${payload.getAdminURL()}`);
    payload.logger.info(`API URL on http://localhost:3000${payload.getAPIURL()}`);
  });
};

startDev();
