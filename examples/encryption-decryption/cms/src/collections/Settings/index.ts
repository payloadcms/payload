import { CollectionConfig } from 'payload/types';
import { decryptField, encryptField } from '../../field-hooks/encryption';
import { getUserDOB } from './endpoints/getUserDOB';

export const Settings: CollectionConfig = {
  slug: 'settings',
  admin: {
    useAsTitle: 'title'
  },
  access: {
    create: () => true,
    delete: () => true,
    read: () => true,
    update: () => true,
  },
  endpoints: [
    getUserDOB,
  ],
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'userDOB',
      type: 'textarea',
      hidden: true,
      hooks: {
        beforeChange: [encryptField],
        afterRead: [decryptField],
      },
    },
  ],
};
