/* eslint-disable no-console */

import path from 'path';
import { buildConfig } from '../buildConfig';
import { CollectionConfig } from '../../types';
import { mongooseAdapter } from '../../src/mongoose';
import payload from '../../src';

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

export default buildConfig({
  serverURL: 'http://localhost:3000',
  admin: {
    user: Users.slug,
  },
  collections: [Users],
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({ payload, url: 'mongodb://localhost:27017/migrations-cli-test' }),
});
