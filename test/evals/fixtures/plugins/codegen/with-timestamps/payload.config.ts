import type { Config, Plugin } from 'payload'

import { buildConfig } from 'payload'

// TODO: implement this plugin so that it adds a `publishedAt` date field
// to every collection in the config.
// Note: spread the config and cast back to Config when returning:
//   return { ...incomingConfig, collections: [...] } as Config
export const withTimestamps: Plugin = (incomingConfig) => {
  return {
    ...incomingConfig,
    collections: (incomingConfig.collections ?? []).map((col) => ({
      ...col,
      // TODO: add the publishedAt date field here
    })),
  } as Config
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
    {
      slug: 'authors',
      fields: [{ name: 'name', type: 'text', required: true }],
    },
  ],
  plugins: [withTimestamps],
})
