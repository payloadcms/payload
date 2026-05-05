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
    {
      name: 'authorDisabled',
      type: 'relationship',
      relationTo: 'users',
      label: 'Author (Disabled)',
      admin: {
        disabled: true,
        description: 'This field is disabled',
      },
    },
    {
      name: 'authorReadOnly',
      type: 'relationship',
      relationTo: 'users',
      label: 'Author (Read Only)',
      admin: {
        readOnly: true,
        description: 'This field is read-only',
      },
    },
  ],
}

export default RelationshipFields
