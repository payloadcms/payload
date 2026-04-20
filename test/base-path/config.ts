import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { Posts } from './collections/Posts.js'
import { seed } from './seed/index.js'
import { BASE_PATH } from './shared.js'

process.env.NEXT_BASE_PATH = BASE_PATH

export default buildConfigWithDefaults({
  admin: {
    autoLogin: false,
  },
  collections: [
    Posts,
    {
      slug: 'media',
      upload: true,
      fields: [],
    },
  ],
  onInit: seed,
  serverURL: `http://localhost:${process.env.PORT || 3000}`,
  endpoints: [
    {
      handler: () => {
        return new Response('Custom Endpoint Response')
      },
      path: '/custom-endpoint',
      method: 'get',
    },
  ],
})
