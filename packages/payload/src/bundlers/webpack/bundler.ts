/* eslint-disable @typescript-eslint/no-var-requires */
import type { PayloadBundler } from '../types'

import { buildAdmin } from './scripts/build'
import { devAdmin } from './scripts/dev'
import { serveAdmin } from './scripts/serve'

export default (): PayloadBundler => ({
  build: async (payloadConfig) => buildAdmin({ payloadConfig }),
  dev: async (payload) => devAdmin({ payload }),
  serve: async (payload) => serveAdmin({ payload }),
})
