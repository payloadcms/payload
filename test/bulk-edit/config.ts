import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { PostsCollection } from './collections/Posts/index.js'
import { RestrictedTabsCollection } from './collections/RestrictedTabs/index.js'
import { TabsCollection } from './collections/Tabs/index.js'
import { seed } from './seed.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfigWithDefaults({
  suite: 'bulk-edit',
  config: {
    admin: {
      importMap: {
        baseDir: path.resolve(dirname),
      },
    },
    collections: [PostsCollection, TabsCollection, RestrictedTabsCollection],
    typescript: {
      outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
  },
  seed,
})
