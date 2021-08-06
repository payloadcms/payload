import { GlobalConfig } from '../../src/globals/config/types';
import checkRole from '../access/checkRole';

export default {
  slug: 'global-with-access',
  label: 'Global with Strict Access',
  access: {
    update: ({ req: { user } }) => checkRole(['admin'], user),
    read: ({ req: { user } }) => checkRole(['admin'], user),
  },
  fields: [
    {
      name: 'title',
      label: 'Site Title',
      type: 'text',
      maxLength: 100,
      required: true,
    },
    {
      name: 'relationship',
      label: 'Test Relationship',
      type: 'relationship',
      relationTo: 'localized-posts',
      hasMany: true,
      required: true,
    },
    {
      name: 'singleRelationship',
      label: 'Test Single Relationship',
      type: 'relationship',
      relationTo: 'localized-posts',
      required: true,
    },
  ],
} as GlobalConfig;
