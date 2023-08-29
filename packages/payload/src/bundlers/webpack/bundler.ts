/* eslint-disable @typescript-eslint/no-var-requires */
import type { PayloadBundler } from '../types.js';

import { buildAdmin } from './scripts/build.js';
import { devAdmin } from './scripts/dev.js';
import { serveAdmin } from './scripts/serve.js';

export default (): PayloadBundler => ({
  build: async (payloadConfig) => buildAdmin({ payloadConfig }),
  dev: async (payload) => devAdmin({ payload }),
  serve: async (payload) => serveAdmin({ payload }),
});
