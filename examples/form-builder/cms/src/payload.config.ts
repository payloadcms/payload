import { buildConfig } from 'payload/config';
import path from 'path';
import FormBuilder from '@payloadcms/plugin-form-builder';
import { Users } from './collections/Users';
import { Pages } from './collections/Pages';
import { MainMenu } from './globals/MainMenu';

export default buildConfig({
  collections: [
    Pages,
    Users,
  ],
  globals: [
    MainMenu,
  ],
  cors: [
    'http://localhost:3000',
    process.env.PAYLOAD_PUBLIC_SITE_URL,
  ],
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },
  plugins: [
    FormBuilder({
      fields: {
        payment: false,
      },

    }),
  ],
});
