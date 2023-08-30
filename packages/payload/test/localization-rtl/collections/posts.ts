import type { CollectionConfig } from '../../../src/collections/config/types.js';

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
      localized: true,
      admin: {
        // rtl: true,
      },
    },
    {
      name: 'email',
      type: 'text',
      label: {
        en: 'Email',
        ar: 'البريد الالكتروني',
      },
      // localized: true,
      admin: {
        rtl: false,
      },
    },
    {
      name: 'content',
      label: {
        en: 'Content',
        ar: 'المحتوى',
      },
      type: 'richText',
      localized: true,
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      defaultValue: ({ user }) => (user.id),
      admin: {
        position: 'sidebar',
      },
    },
  ],
};
