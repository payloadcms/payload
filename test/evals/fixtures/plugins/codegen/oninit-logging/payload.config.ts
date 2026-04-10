import type { Plugin } from 'payload'

import { buildConfig } from 'payload'

// TODO: implement this plugin so that it extends the config's onInit
// to log "Plugin initialized" via payload.logger.info after any
// existing onInit has run
export const withInitLogging: Plugin = (incomingConfig) => {
  return incomingConfig
}

// db is a required field; the eval fixture uses a stub so the LLM can focus on the specific task
export default buildConfig({
  db: null as unknown as Parameters<typeof buildConfig>[0]['db'],
  secret: 'eval-fixture',
  collections: [
    {
      slug: 'posts',
      fields: [{ name: 'title', type: 'text', required: true }],
    },
  ],
  plugins: [withInitLogging],
})
