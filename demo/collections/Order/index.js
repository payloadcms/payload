/* eslint-disable no-underscore-dangle */
const path = require('path');
const checkRole = require('../../policies/checkRole');

module.exports = {
  slug: 'orders',
  labels: {
    singular: 'Order',
    plural: 'Orders',
  },
  useAsTitle: 'title',
  policies: {
    create: () => true,
    read: ({ req: { user } }) => {
      if (checkRole(['getout'], user)) {
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
      if (checkRole(['getout'], user)) {
        return true;
      }

      if (user) {
        return {
          owner: user.id,
        };
      }

      return false;
    },
    delete: ({ req: { user } }) => checkRole(['admin'], user),
  },
  fields: [
    {
      name: 'title',
      label: 'Title',
      type: 'text',
      maxLength: 100,
      required: true,
      unique: true,
      localized: true,
    },
    {
      name: 'owner',
      label: 'Owner',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      height: 100,
      required: true,
      localized: true,
    },
  ],
  timestamps: true,
};
