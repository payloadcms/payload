import type { CollectionConfig, Where } from 'payload'

import { getTenantFromCookie } from '@payloadcms/plugin-multi-tenant/utilities'

import { postsSlug } from '../shared.js'

export const Posts: CollectionConfig = {
  slug: postsSlug,
  labels: {
    singular: 'Post',
    plural: 'Posts',
  },
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      label: 'Title',
      type: 'text',
      required: true,
    },
    {
      name: 'relatedLinks',
      relationTo: 'links',
      type: 'relationship',
    },
    {
      name: 'author',
      relationTo: 'users',
      type: 'relationship',
      filterOptions: ({ req }) => {
        // try using coookies from next?
        const selectedTenant = getTenantFromCookie(req.headers, req.payload.db.defaultIDType)
        if (!selectedTenant) {
          return false
        }

        return {
          or: [
            {
              'tenants.tenant': {
                equals: selectedTenant,
              },
            },
            {
              roles: {
                in: ['admin'],
              },
            },
          ],
        }
      },
    },
  ],
}
