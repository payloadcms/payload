import { buildConfig } from 'payload/config';
import path from 'path';
import seo from '../../dist';
// import seo from '../../src';
import Users from './collections/Users';
import Pages from './collections/Pages';
import Media from './collections/Media';

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
    Pages,
    Media
  ],
  localization: {
    locales: [
      'en',
      'es',
      'de',
    ],
    defaultLocale: 'en',
    fallback: true,
  },
  plugins: [
    seo({
      collections: [
        'pages',
      ],
      uploadsCollection: 'media',
      generateTitle: ({ doc }) => `Website.com — ${doc?.title?.value}`,
      generateDescription: ({ doc }) => doc?.excerpt?.value,
      generateURL: ({ doc }) => `https://yoursite.com/${doc?.slug?.value || ''}`
    }),
  ],
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts')
  },
});
