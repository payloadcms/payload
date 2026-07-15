import { Button } from '@payloadcms/ui'
import { DefaultTemplate } from '@payloadcms/ui/rsc'
import type { CollectionConfig } from 'payload'

export const slug: CollectionConfig['fields'][number] = {
  name: 'slug',
  type: 'text',
  admin: {
    components: {
      Field: {
        path: '@payloadcms/ui#SlugField',
      },
    },
  },
}

// Plain prose strings that mention the old path but do not match the
// `<package>#<export>` shape must be left untouched.
export const description = '@payloadcms/next/rsc#CollectionCards is the old path'

export const usage = { Button, DefaultTemplate }
