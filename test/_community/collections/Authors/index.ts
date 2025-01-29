import type { CollectionConfig } from 'payload'

const contentfulDefaultFields: CollectionConfig['fields'] = [
  {
    name: 'isFromContentful',
    type: 'checkbox',
    label: 'Is From Contentful (migration use only)',
    hidden: true,
  },
  {
    name: 'noIndex',
    type: 'checkbox',
    label: 'No Index',
  },
  {
    name: 'originalContentfulId',
    type: 'text',
    label: 'The original contentful ID of this item (migration use only)',
  },
]

export const Authors: CollectionConfig = {
  slug: 'authors',
  admin: {
    useAsTitle: 'name',
  },
  versions: {
    drafts: true,
    maxPerDoc: 0, // Removes the limit on the number of versions we can store
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Name',
      required: true,
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
      label: 'Avatar',
      required: true,
    },
    {
      name: 'biography',
      type: 'richText',
      label: 'Biography',
    },
    ...contentfulDefaultFields,
  ],
}
