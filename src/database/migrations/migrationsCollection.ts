import type { CollectionConfig } from '../../collections/config/types';

export const migrationsCollection: CollectionConfig = {
  slug: 'payload-migrations',
  admin: {
    hidden: true,
  },
  graphQL: false,
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'batch',
      type: 'number',
    },
    // TODO: determine how schema will impact migration workflow
    {
      name: 'schema',
      type: 'json',
    },
    // TODO: do we need to persist the indexes separate from the schema?
    // {
    //   name: 'indexes',
    //   type: 'array',
    //   fields: [
    //     {
    //       name: 'index',
    //       type: 'text',
    //     },
    //     {
    //       name: 'value',
    //       type: 'json',
    //     },
    //   ],
    // },
  ],
};
