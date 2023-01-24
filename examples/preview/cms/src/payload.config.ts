import { buildConfig } from 'payload/config';
import nestedDocs from '@payloadcms/plugin-nested-docs';
import path from 'path';
import { Users } from './collections/Users';
import { Pages } from './collections/Pages';
import { MainMenu } from './globals/MainMenu';

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
    nestedDocs({
      collections: ['pages'],
      generateLabel: (_, doc) => doc.title as string,
      generateURL: (docs) => docs.reduce((url, doc) => `${url}/${doc.slug}`, ''),
    }),
  ],
});
