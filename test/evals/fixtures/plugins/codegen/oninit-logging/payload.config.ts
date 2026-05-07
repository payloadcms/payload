import type { Plugin } from 'payload'

import { stubAdapter } from '@/db-stub.js'
import { buildConfig } from 'payload'

// TODO: implement this plugin so that it extends the config's onInit
// to log "Plugin initialized" via payload.logger.info after any
// existing onInit has run
export const withInitLogging: Plugin = (incomingConfig) => {
  return incomingConfig
}

export default buildConfig({
  db: stubAdapter,
  secret: 'eval-fixture',
  collections: [
    {
      slug: 'posts',
      fields: [{ name: 'title', type: 'text', required: true }],
    },
  ],
  plugins: [withInitLogging],
})
