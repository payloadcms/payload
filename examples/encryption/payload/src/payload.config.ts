import { buildConfig } from 'payload/config';
import path from 'path';
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
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL,
  cors: [
    process.env.PAYLOAD_PUBLIC_SITE_URL,
  ],
  csrf: [
    process.env.PAYLOAD_PUBLIC_SITE_URL,
  ],
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },
});
