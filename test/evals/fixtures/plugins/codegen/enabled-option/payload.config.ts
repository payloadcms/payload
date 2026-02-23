import type { Plugin } from 'payload'

import { buildConfig } from 'payload'

type WithFeatureOptions = {
  enabled: boolean
}

// TODO: implement this plugin factory so that when `enabled` is false
// it returns the config unchanged; when true it adds a `feature` text
// field to every collection
export function withFeature(_options: WithFeatureOptions): Plugin {
  return (incomingConfig) => {
    return incomingConfig
  }
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
  plugins: [withFeature({ enabled: true })],
})
