/* eslint-disable @typescript-eslint/no-var-requires */
import { devAdmin } from './scripts/dev';
import { PayloadBundler } from '../types';
import { buildAdmin } from './scripts/build';

export default (): PayloadBundler => ({
  dev: async (payload) => devAdmin({ payload }),
  build: async (payloadConfig) => buildAdmin({ payloadConfig }),
  preview: async (payload) => devAdmin({ payload }),
});
