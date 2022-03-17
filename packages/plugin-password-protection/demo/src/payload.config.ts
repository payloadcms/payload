import { buildConfig } from 'payload/config';
import path from 'path';
// import passwordProtection from '../../dist';
import passwordProtection from '../../src';
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
    passwordProtection({
      collections: [
        'pages'
      ],
    }),
  ],
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts')
  },
});
