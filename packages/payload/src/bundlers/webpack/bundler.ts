/* eslint-disable @typescript-eslint/no-var-requires */
import { PayloadBundler } from '../types.js';
import { devAdmin } from './scripts/dev.js';
import { buildAdmin } from './scripts/build.js';
import { serveAdmin } from './scripts/serve.js';

export default (): PayloadBundler => ({
  dev: async (payload) => devAdmin({ payload }),
  build: async (payloadConfig) => buildAdmin({ payloadConfig }),
  serve: async (payload) => serveAdmin({ payload }),
});
