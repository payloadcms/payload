/* eslint-disable no-console */

import path from 'path';
import { buildConfig } from '../buildConfig';
import { DatabaseAdapter } from '../..';
import { CollectionConfig } from '../../types';

const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  fields: [
    {
      name: 'custom',
      type: 'text',
    },
    {
      name: 'checkbox',
      type: 'checkbox',
    },
  ],
};

// @ts-expect-error partial
const mockAdapter: DatabaseAdapter = {
  // payload: undefined,
  migrationDir: path.resolve(__dirname, '.migrations'),
  migrateStatus: async () => console.log('TODO: migrateStatus not implemented.'),
  createMigration: async (): Promise<void> => console.log('TODO: createMigration not implemented.'),
  migrate: async (): Promise<void> => console.log('TODO: migrate not implemented.'),
  migrateDown: async (): Promise<void> => console.log('TODO: migrateDown not implemented.'),
  migrateRefresh: async (): Promise<void> => console.log('TODO: migrateRefresh not implemented.'),
  migrateReset: async (): Promise<void> => console.log('TODO: migrateReset not implemented.'),
  migrateFresh: async (): Promise<void> => console.log('TODO: migrateFresh not implemented.'),
};

export default buildConfig({
  serverURL: 'http://localhost:3000',
  admin: {
    user: Users.slug,
  },
  collections: [Users],
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },
  // db: mockAdapter,
  graphQL: {
    schemaOutputFile: path.resolve(__dirname, 'generated-schema.graphql'),
  },
});
