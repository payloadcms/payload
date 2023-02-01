import { buildConfig } from 'payload/config';
import path from 'path';
// import redirects from '../../dist';
import redirects from '../../src'
import Users from './collections/Users'
import Pages from './collections/Pages'

export default buildConfig({
  serverURL: 'http://localhost:3000',
  admin: {
    user: Users.slug,
    webpack: (config) => {
      const newConfig = {
        ...config,
        resolve: {
          ...config.resolve,
          alias: {
            ...config.resolve.alias,
            react: path.join(__dirname, "../node_modules/react"),
            "react-dom": path.join(__dirname, "../node_modules/react-dom"),
            "payload": path.join(__dirname, "../node_modules/payload"),
          },
        },
      };

      return newConfig;
    },
  },
  collections: [
    Users,
    Pages
  ],
  localization: {
    locales: [
      'en',
      'es'
    ],
    defaultLocale: 'en',
    fallback: true,
  },
  plugins: [
    redirects({
      collections: ['pages'],
    }),
  ],
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts')
  },
});
