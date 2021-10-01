import { CollectionConfig } from '../../src/collections/config/types';
import checkRole from '../access/checkRole';

const access = ({ req: { user } }) => {
  const isAdmin = checkRole(['admin'], user);

  if (isAdmin) {
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
};

const Files: CollectionConfig = {
  slug: 'files',
  labels: {
    singular: 'File',
    plural: 'Files',
  },
  upload: {
    staticURL: '/files',
    staticDir: './files',
  },
  access: {
    create: () => true,
    read: access,
    update: access,
    delete: access,
  },
  fields: [
    {
      name: 'type',
      label: 'Type',
      type: 'select',
      options: [{
        value: 'Type 1',
        label: 'Type 1 Label',
      }, {
        value: 'Type 2',
        label: 'Type 2 Label',
      }, {
        value: 'Type 3',
        label: 'Type 3 Label',
      }],
      defaultValue: 'Type 1',
      required: true,
    },
    {
      name: 'owner',
      label: 'Owner',
      type: 'relationship',
      relationTo: 'admins',
      required: true,
    },
  ],
  timestamps: true,
  admin: {
    useAsTitle: 'filename',
  },
};

export default Files;
