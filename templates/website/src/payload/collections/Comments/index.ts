import type { CollectionConfig } from 'payload/types'

import { checkRole } from '../Users/checkRole'

const Comments: CollectionConfig = {
  slug: 'comments',
  admin: {
    useAsTitle: 'title',
  },
  access: {
    // Public users should only be able to read published comments
    // Users should be able to read their own comments
    // Admins should be able to read all comments
    read: ({ data, req: { user } }) => {
      return Boolean(
        data?.status === 'published' ||
          checkRole(['admin'], user) ||
          (typeof data?.user === 'string' ? data?.user : data?.user?.id) === user?.id,
      )
    },
    // Public users should not be able to create published comments
    // User should only be allowed to create and their own draft comments
    // Admins should have full control
    create: ({ data, req: { user } }) => {
      return Boolean(
        checkRole(['admin'], user) ||
          (data?.status === 'draft' &&
            (typeof data?.user === 'string' ? data?.user : data?.user?.id) === user?.id),
      )
    },
    // Public users should not be able to update published comments
    // Users should only be allowed to update their own draft comments
    // Admins should have full control
    update: ({ data, req: { user } }) => {
      return Boolean(
        checkRole(['admin'], user) ||
          (data?.status === 'draft' &&
            (typeof data?.user === 'string' ? data?.user : data?.user?.id) === user?.id),
      )
    },
    // Only admins can delete comments
    delete: ({ req: { user } }) => checkRole(['admin'], user),
  },
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      hasMany: false,
    },
    {
      name: 'doc',
      type: 'relationship',
      relationTo: ['posts'],
      hasMany: false,
    },
    {
      name: 'comment',
      type: 'textarea',
    },
  ],
}

export default Comments
