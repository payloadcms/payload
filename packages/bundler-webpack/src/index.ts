/* eslint-disable @typescript-eslint/no-var-requires */
import { PayloadBundler } from '../../payload/dist/bundlers/types'
import { devAdmin } from './scripts/dev'
import { buildAdmin } from './scripts/build'
import { serveAdmin } from './scripts/serve'

export default (): PayloadBundler => ({
  dev: async (payload) => devAdmin({ payload }),
  build: async (payloadConfig) => buildAdmin({ payloadConfig }),
  serve: async (payload) => serveAdmin({ payload }),
})
