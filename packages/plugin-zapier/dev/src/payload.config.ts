import { buildConfig } from 'payload/config'
import Users from './collections/Users'
// eslint-disable-next-line import/no-relative-packages
import { zapierPlugin } from '../../src/plugin'

export default buildConfig({
  collections: [Users],
  plugins: [
    zapierPlugin({
      collections: [
        {
          slug: 'users',
          webhook: 'https://hooks.zapier.com/hooks/catch/13379170/bc9s17l/',
          hooks: ['afterUpdate', 'afterDelete'],
        },
      ],
    }),
  ],
})
