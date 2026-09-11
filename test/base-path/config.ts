import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { Posts } from './collections/Posts.js'
import { seed } from './seed/index.js'
import { BASE_PATH } from './shared.js'

process.env.NEXT_BASE_PATH = BASE_PATH

export default buildConfigWithDefaults({
  suite: 'base-path',
  config: {
    admin: {
      autoLogin: false,
    },
    collections: [
      Posts,
      {
        slug: 'media',
        fields: [],
        upload: true,
        versions: false,
      },
    ],
    endpoints: [
      {
        handler: () => {
          return new Response('Custom Endpoint Response')
        },
        method: 'get',
        path: '/custom-endpoint',
      },
    ],
    serverURL: `http://localhost:${process.env.PORT || 3000}`,
  },
  seed,
})
