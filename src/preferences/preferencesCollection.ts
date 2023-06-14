import { CollectionConfig } from '../collections/config/types';
import { Access, Config } from '../config/types';
import findOne from './requestHandlers/findOne';
import update from './requestHandlers/update';
import deleteHandler from './requestHandlers/delete';

const preferenceAccess: Access = ({ req }) => ({
  'user.value': {
    equals: req?.user?.id,
  },
});

const getPreferencesCollection = (config: Config): CollectionConfig => ({
  slug: '_preferences',
  admin: {
    hidden: true,
  },
  access: {
    read: preferenceAccess,
    delete: preferenceAccess,
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: config.collections
        .filter((collectionConfig) => collectionConfig.auth)
        .map((collectionConfig) => collectionConfig.slug),
      required: true,
      hooks: {
        beforeValidate: [
          (({ req }) => {
            if (!req?.user) {
              return null;
            }
            return {
              value: req?.user.id,
              relationTo: req?.user.collection,
            };
          }),
        ],
      },
    },
    {
      name: 'key',
      type: 'text',
    },
    {
      name: 'value',
      type: 'json',
    },
  ],
  indexes: [
    {
      fields: {
        'user.value': 1,
        'user.relationTo': 1,
        key: 1,
      },
      options: {
        unique: true,
      },
    },
  ],
  endpoints: [
    {
      method: 'get',
      path: '/:key',
      handler: findOne,
    },
    {
      method: 'delete',
      path: '/:key',
      handler: deleteHandler,
    },
    {
      method: 'post',
      path: '/:key',
      handler: update,
    },
  ],
});

export default getPreferencesCollection;
