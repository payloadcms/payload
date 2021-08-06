import { CollectionConfig } from '../../src/collections/config/types';
import checkRole from '../access/checkRole';

const StrictAccess: CollectionConfig = {
  slug: 'strict-access',
  labels: {
    singular: 'Strict Access',
    plural: 'Strict Access',
  },
  admin: {
    useAsTitle: 'email',
  },
  access: {
    create: () => true,
    read: ({ req: { user } }) => {
      if (checkRole(['admin'], user)) {
        return true;
      }

      if (user) {
        return {
          owner: {
            equals: user.id,
          },
        };
      }

      return false;
    },
    update: ({ req: { user } }) => {
      if (checkRole(['admin'], user)) {
        return true;
      }

      if (user) {
        return {
          owner: {
            equals: user.id,
          },
        };
      }

      return false;
    },
    delete: ({ req: { user } }) => checkRole(['admin'], user),
  },
  fields: [
    {
      name: 'address',
      type: 'text',
      label: 'Address',
      required: true,
    },
    {
      name: 'city',
      type: 'text',
      label: 'City',
      required: true,
    },
    {
      name: 'state',
      type: 'text',
      label: 'State',
      required: true,
    },
    {
      name: 'zip',
      type: 'number',
      label: 'ZIP Code',
      required: true,
    },
  ],
  timestamps: true,
};

export default StrictAccess;
