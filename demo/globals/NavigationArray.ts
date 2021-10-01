import { GlobalConfig } from '../../src/globals/config/types';
import checkRole from '../access/checkRole';

export default {
  slug: 'navigation-array',
  access: {
    update: ({ req: { user } }) => checkRole(['admin', 'user'], user),
    read: () => true,
  },
  admin: {
    description: 'A description for the editor',
  },
  fields: [
    {
      name: 'array',
      label: 'Array',
      type: 'array',
      localized: true,
      fields: [{
        name: 'text',
        label: 'Text',
        type: 'text',
      }, {
        name: 'textarea',
        label: 'Textarea',
        type: 'textarea',
      }],
    },
  ],
} as GlobalConfig;
