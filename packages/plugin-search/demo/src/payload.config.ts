import path from 'path'
import { buildConfig } from 'payload/config'

// import searchPlugin from '../../dist';
import searchPlugin from '../../src'
import { Pages } from './collections/Pages'
import { Posts } from './collections/Posts'
import { Users } from './collections/Users'

export default buildConfig({
  serverURL: 'http://localhost:3000',
  admin: {
    user: Users.slug,
    webpack: config => {
      const newConfig = {
        ...config,
        resolve: {
          ...config.resolve,
          alias: {
            ...config.resolve.alias,
            react: path.join(__dirname, '../node_modules/react'),
            'react-dom': path.join(__dirname, '../node_modules/react-dom'),
            payload: path.join(__dirname, '../node_modules/payload'),
          },
        },
      }

      return newConfig
    },
  },
  collections: [Users, Pages, Posts],
  plugins: [
    searchPlugin({
      collections: ['pages', 'posts'],
      searchOverrides: {
        fields: [
          {
            name: 'excerpt',
            label: 'Excerpt',
            type: 'text',
            admin: {
              readOnly: true,
            },
          },
        ],
      },
      beforeSync: ({ originalDoc, searchDoc }) => ({
        ...searchDoc,
        excerpt: originalDoc?.excerpt || 'This is a fallback excerpt',
      }),
      defaultPriorities: {
        pages: 10,
        posts: ({ title }) => (title === 'Hello, world!' ? 30 : 20),
      },
    }),
  ],
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },
})
