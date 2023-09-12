import { CollectionConfig } from 'payload/types';
import { decryptField, encryptField } from '../../field-hooks/encryption';
import { getUserDOB } from './endpoints/getUserDOB';

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
  },
  access: {
    read: () => true,
  },
  endpoints: [
    getUserDOB,
  ],
  fields: [
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
