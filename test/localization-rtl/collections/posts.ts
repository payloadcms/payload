import type { CollectionConfig } from 'payload'

export const Posts: CollectionConfig = {
  slug: 'posts',
  labels: {
    singular: {
      en: 'Post',
      ar: 'منشور',
    },
    plural: {
      en: 'Posts',
      ar: 'منشورات',
    },
  },
  admin: {
    description: { en: 'Description', ar: 'وصف' },
    listSearchableFields: ['title', 'description'],
    useAsTitle: 'title',
    defaultColumns: ['id', 'title', 'description'],
  },
  fields: [
    {
      name: 'title',
      label: {
        en: 'Title',
        ar: 'عنوان',
      },
      type: 'text',
      admin: {
        rtl: false,
      },
    },
    {
      name: 'description',
      type: 'text',
      localized: true,
      admin: {
        rtl: true,
      },
    },
    {
      name: 'content',
      type: 'richText',
      localized: true,
    },
  ],
}
