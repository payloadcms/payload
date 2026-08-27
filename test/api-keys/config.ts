import { fileURLToPath } from 'node:url'
import path from 'path'
import { payloadAPIKeysCollectionSlug } from 'payload'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const adminsSlug = 'api-key-admins'
export const customersSlug = 'api-key-customers'
export const otherCustomersSlug = 'api-key-other-customers'
export const verifiedCustomersSlug = 'api-key-verified-customers'

export default buildConfigWithDefaults({
  admin: {
    user: adminsSlug,
  },
  collections: [
    {
      slug: adminsSlug,
      access: {
        // No custom access.admin: every account in this collection can log into the
        // Admin Panel (the default when access.admin is omitted and this collection
        // matches config.admin.user), so switching apiKeyAccessLevel on your own account
        // never locks you out - only what you can see once inside changes.
        read: ({ req }) => {
          if (!req.user) {
            return false
          }
          if (req.user.apiKeyAccessLevel && req.user.apiKeyAccessLevel !== 'none') {
            return true
          }
          return { id: { equals: req.user.id } }
        },
      },
      auth: {
        useAPIKey: {
          access: {
            manageOthers: ({ req }) => req.user?.apiKeyAccessLevel === 'canManage',
            readOthers: ({ req }) =>
              req.user?.apiKeyAccessLevel === 'canSee' ||
              req.user?.apiKeyAccessLevel === 'canManage',
          },
          storage: 'collection',
        },
      },
      fields: [
        {
          name: 'apiKeyAccessLevel',
          type: 'select',
          admin: {
            description:
              'Controls what this account can see/do with OTHER users’ API keys, for manually testing the payload-api-keys access model. Never affects visibility of your own keys, and never exposes another owner’s decrypted secret regardless of level.',
          },
          defaultValue: 'canManage',
          options: [
            { label: 'No Access - only your own keys', value: 'none' },
            { label: 'Can See - view others’ key metadata, cannot revoke', value: 'canSee' },
            { label: 'Can Manage - view and revoke others’ keys', value: 'canManage' },
          ],
          required: true,
        },
      ],
    },
    {
      slug: customersSlug,
      auth: {
        useAPIKey: {
          storage: 'collection',
        },
      },
      fields: [],
    },
    {
      // A second, distinct API-key-enabled auth collection so cross-collection
      // owner scoping (header slug must equal owner.relationTo) is testable.
      slug: otherCustomersSlug,
      auth: {
        useAPIKey: {
          storage: 'collection',
        },
      },
      fields: [],
    },
    {
      // Verification-required auth collection, so the api-key strategy's rejection
      // of an unverified owner is testable in collection mode.
      slug: verifiedCustomersSlug,
      auth: {
        useAPIKey: {
          storage: 'collection',
        },
        verify: true,
      },
      fields: [],
    },
  ],
  onInit: (payload) => {
    // Surface the normally-hidden payload-api-keys collection in the admin nav, in its
    // own group, purely for manual exploration in this test suite's dev server - the
    // collection is otherwise reached only through the apiKeys join field on each auth
    // collection's edit view (see the API keys design spec's "generated collection"
    // section for why it's hidden by default).
    const apiKeysCollectionAdmin = payload.collections[payloadAPIKeysCollectionSlug]?.config.admin
    if (apiKeysCollectionAdmin) {
      apiKeysCollectionAdmin.hidden = false
      apiKeysCollectionAdmin.group = 'API Keys'
    }
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
