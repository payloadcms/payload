import type { Config, Plugin } from 'payload'

import { buildConfig } from 'payload'

// TODO: implement this plugin so that it adds a "tenant" relationship
// field (pointing to the "tenants" collection) to every collection
// that has auth enabled.
// Note: spread the config and cast back to Config when returning:
//   return { ...incomingConfig, collections: [...] } as Config
export const withTenancy: Plugin = (incomingConfig) => {
  return {
    ...incomingConfig,
    collections: (incomingConfig.collections ?? []).map((col) => ({
      ...col,
      // TODO: add the tenant relationship field to auth-enabled collections
    })),
  } as Config
}

// db is a required field; the eval fixture uses a stub so the LLM can focus on the specific task
export default buildConfig({
  db: null as unknown as Parameters<typeof buildConfig>[0]['db'],
  secret: 'eval-fixture',
  collections: [
    {
      slug: 'tenants',
      fields: [{ name: 'name', type: 'text', required: true }],
    },
    {
      slug: 'users',
      auth: true,
      fields: [{ name: 'email', type: 'email', required: true }],
    },
    {
      slug: 'posts',
      fields: [{ name: 'title', type: 'text', required: true }],
    },
  ],
  plugins: [withTenancy],
})
