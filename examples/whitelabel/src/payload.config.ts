// eslint-disable-next-line import/no-extraneous-dependencies
import { buildConfig } from 'payload/config';
import path from 'path';

import { Icon } from './graphics/Icon';
import { Logo } from './graphics/Logo';

export default buildConfig({
  serverURL: 'http://localhost:3000',
  admin: {
    // Add your own logo and icon here
    components: {
      graphics: {
        Icon,
        Logo,
      },
    },
    // Add your own meta data here
    meta: {
      favicon: '/assets/favicon.svg',
      ogImage: '/assets/ogImage.png',
      titleSuffix: '- Your App Name',
    },
  },
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },
  graphQL: {
    schemaOutputFile: path.resolve(__dirname, 'generated-schema.graphql'),
  },
});
