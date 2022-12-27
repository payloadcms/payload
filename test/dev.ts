import fs from 'fs';
import path from 'path';
import shelljs from 'shelljs';
import express from 'express';
import { v4 as uuid } from 'uuid';
import payload from '../src';
import { copyfilesAsync } from './helpers/copyfiles';

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

const init = async () => {
  // remove old /build folder (if it exists)
  const buildFolder = path.resolve(__dirname, '../build/config');
  shelljs.rm('-rf', buildFolder);

  // copy files necessary by this test into /build/config
  await copyfilesAsync([
    `./test/${testSuiteDir}/**/*.{html,css,scss,ttf,woff,woff2,eot,svg,jpg,png}`,
    './build/config',
  ], {
    up: 2,
  });

  await payload.initAsync({
    secret: uuid(),
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

  // Redirect root to Admin panel
  expressApp.get('/', (_, res) => {
    res.redirect('/admin');
  });

  const externalRouter = express.Router();

  externalRouter.use(payload.authenticate);

  expressApp.listen(3000, async () => {
    payload.logger.info(`Admin URL on ${payload.getAdminURL()}`);
    payload.logger.info(`API URL on ${payload.getAPIURL()}`);
  });
};

init();
