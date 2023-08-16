import type { InlineConfig } from 'vite';
import { PayloadBundler } from '../types';
import { devAdmin } from './scripts/dev';
import { buildAdmin } from './scripts/build';
import { serveAdmin } from './scripts/serve';

export default (viteConfig?: InlineConfig): PayloadBundler => ({
  dev: async (payload) => devAdmin({ payload, viteConfig }),
  build: async (payloadConfig) => buildAdmin({ payloadConfig, viteConfig }),
  serve: async (payload) => serveAdmin({ payload }),
});
