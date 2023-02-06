import { buildConfig } from 'payload/config';
import redirects from '@payloadcms/plugin-redirects';
import path from 'path';
import { Users } from './collections/Users';
import { Pages } from './collections/Pages';
import { MainMenu } from './globals/MainMenu';

require('dotenv').config();

export default buildConfig({
  collections: [
    Pages,
    Users,
  ],
  cors: [
    'http://localhost:3000',
    process.env.PAYLOAD_PUBLIC_SITE_URL,
  ],
  globals: [
    MainMenu,
  ],
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },
  plugins: [
    redirects({
      collections: [
        'pages',
      ],
    }),
  ],
});
