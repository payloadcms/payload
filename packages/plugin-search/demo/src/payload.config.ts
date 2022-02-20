import { buildConfig } from 'payload/config';
import path from 'path';
import searchPlugin from '../../dist';
// import searchPlugin from '../../src';
import { Users } from './collections/Users';
import { Pages } from './collections/Pages';

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
  plugins: [
    searchPlugin({
      collections: [
        'pages'
      ],
      syncOnlyPublished: false,
      beforeSync: ({ doc }) => {
        // Transform your docs in any way here
        const modifiedDoc = {
          ...doc,
          excerpt: doc?.excerpt || 'This is a fallback excerpt'
        }
        return modifiedDoc;
      },
      searchOverrides: {
        fields: [
          {
            name: 'excerpt',
            label: 'Excerpt',
            type: 'text',
            admin: {
              readOnly: true,
            }
          }
        ]
      }
    }),
  ],
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts')
  },
});
