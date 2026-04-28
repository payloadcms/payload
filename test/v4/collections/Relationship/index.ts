import type { CollectionConfig } from 'payload'

import { relationshipFieldsSlug, textFieldsSlug } from '../../slugs.js'

const RelationshipFields: CollectionConfig = {
  slug: relationshipFieldsSlug,
  fields: [
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      label: 'Author',
      admin: {
        description: 'The author of this post',
      },
    },
    {
      name: 'authorRequired',
      type: 'relationship',
      relationTo: 'users',
      label: 'Author',
      required: true,
      admin: {
        description: 'The author of this post',
      },
    },
    {
      name: 'relatedPosts',
      type: 'relationship',
      relationTo: textFieldsSlug,
      hasMany: true,
      label: 'Related Posts',
      admin: {
        description: 'Select related posts',
      },
    },
  ],
}

export default RelationshipFields
