import type { InlineConfig } from 'vite';
import { PayloadBundler } from '../types';
import { devAdmin } from './scripts/dev';
import { buildAdmin } from './scripts/build';


export default (viteConfig?: InlineConfig): PayloadBundler => ({
  dev: async (payload) => devAdmin({ payload, viteConfig }),
  build: async (payloadConfig) => buildAdmin({ payloadConfig, viteConfig }),
  preview: async (payload) => devAdmin({ payload, viteConfig }),
});
