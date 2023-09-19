// @ts-expect-error
import type { InlineConfig } from 'vite'

import type { PayloadBundler } from './types'

import { buildAdmin } from './scripts/build'
import { devAdmin } from './scripts/dev'
import { serveAdmin } from './scripts/serve'

export const viteBundler: (viteConfig?: InlineConfig) => PayloadBundler = (viteConfig) => ({
  build: async (payloadConfig) => buildAdmin({ payloadConfig, viteConfig }),
  dev: async (payload) => devAdmin({ payload, viteConfig }),
  serve: async (payload) => serveAdmin({ payload }),
})
