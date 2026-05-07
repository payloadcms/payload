import type { Config, Plugin } from 'payload'

import { stubAdapter } from '@/db-stub.js'
import { buildConfig } from 'payload'

type WithFeatureOptions = {
  enabled: boolean
}

// TODO: implement this plugin factory so that when `enabled` is false
// it returns the config unchanged; when true it adds a `feature` text
// field to every collection.
// Note: spread the config and cast back to Config when returning:
//   return { ...incomingConfig, collections: [...] } as Config
export function withFeature(_options: WithFeatureOptions): Plugin {
  return (incomingConfig) => {
    return {
      ...incomingConfig,
      collections: (incomingConfig.collections ?? []).map((col) => ({
        ...col,
        // TODO: conditionally add the feature field based on options.enabled
      })),
    } as Config
  }
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
  plugins: [withFeature({ enabled: true })],
})
