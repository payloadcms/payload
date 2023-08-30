import type { CollectionConfig } from '../../../src/collections/config/types.js';

export const Users: CollectionConfig = {
  slug: 'users',
  labels: {
    plural: {
      en: 'Users',
      ar: 'المستخدمين',
    },
  },
  auth: true,
  fields: [
    {
      name: 'role',
      type: 'select',
      label: {
        ar: 'دور',
        en: 'Role',
      },
      options: [
        { label: { ar: 'مدير', en: 'Admin' }, value: 'admin' },
        { label: { ar: 'محرر', en: 'Editor' }, value: 'editor' },
        { label: { ar: 'مبرمج', en: 'Developer' }, value: 'developer' },
        { label: { ar: 'مصمم', en: 'Designer' }, value: 'designer' },
      ],
    },
  ],
};
