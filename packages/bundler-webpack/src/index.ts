import type { PayloadBundler } from 'payload/dist/bundlers/types'

import { buildAdmin } from './scripts/build'
import { devAdmin } from './scripts/dev'
import { serveAdmin } from './scripts/serve'

export const webpackBundler: () => PayloadBundler = () => ({
  build: async (payloadConfig) => buildAdmin({ payloadConfig }),
  dev: async (payload) => devAdmin({ payload }),
  serve: async (payload) => serveAdmin({ payload }),
})
