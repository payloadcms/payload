import type { BaseAccess } from 'payload'

import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const postsSlug = 'base-access-posts'
export const settingsSlug = 'base-access-settings'
export const tenantHeader = 'x-base-access-tenant'
export const denyHeader = 'x-deny-base-access'

const baseAccess: BaseAccess = {
  collections: {
    admin: ({ slug, req }) => {
      if (req.headers.get(denyHeader) === 'true' && slug === 'users') {
        return false
      }

      return true
    },
    create: ({ slug, req }) => {
      if (req.headers.get(denyHeader) === 'true' && (slug === postsSlug || slug === 'users')) {
        return false
      }

      return true
    },
    read: ({ slug, req }) => {
      const tenant = req.headers.get(tenantHeader)

      if (slug === postsSlug && tenant) {
        return {
          tenant: {
            equals: tenant,
          },
        }
      }

      return true
    },
    validate: ({ slug, req }) => {
      if (req.headers.get(denyHeader) === 'true' && slug === postsSlug) {
        return false
      }

      return true
    },
  },
  globals: {
    update: ({ slug, req }) => {
      if (req.headers.get(denyHeader) === 'true' && slug === settingsSlug) {
        return false
      }

      return true
    },
    validate: ({ slug, req }) => {
      if (req.headers.get(denyHeader) === 'true' && slug === settingsSlug) {
        return false
      }

      return true
    },
  },
}

export default buildConfigWithDefaults({
  baseAccess,
  collections: [
    {
      slug: postsSlug,
      access: {
        create: () => true,
        delete: () => true,
        read: () => ({
          status: {
            equals: 'published',
          },
        }),
        update: () => true,
      },
      fields: [
        {
          name: 'title',
          type: 'text',
        },
        {
          name: 'tenant',
          type: 'text',
        },
        {
          name: 'status',
          type: 'text',
        },
      ],
      versions: false,
    },
  ],
  globals: [
    {
      slug: settingsSlug,
      access: {
        read: () => true,
        update: () => true,
      },
      fields: [
        {
          name: 'title',
          type: 'text',
        },
      ],
      versions: false,
    },
  ],
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
