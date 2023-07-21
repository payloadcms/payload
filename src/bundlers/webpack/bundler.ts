/* eslint-disable @typescript-eslint/no-var-requires */
import { PayloadBundler } from '../types';
import { devAdmin } from './scripts/dev';
import { buildAdmin } from './scripts/build';

export default (): PayloadBundler => ({
  dev: async (payload) => devAdmin({ payload }),
  build: async (payloadConfig) => buildAdmin({ payloadConfig }),
  preview: async (payload) => devAdmin({ payload }),
});
