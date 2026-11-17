import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { Assets } from './collections/Assets/index.js'
import { Containers } from './collections/Containers/index.js'
import { Folders } from './collections/Folders/index.js'
import { GuardedMembers } from './collections/GuardedMembers/index.js'
import { Posts } from './collections/Posts/index.js'
import { Users } from './collections/Users/index.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export default buildConfigWithDefaults({
  config: {
    collections: [Users, Containers, Folders, Posts, Assets, GuardedMembers],
    typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  },
  suite: 'hierarchy-contents',
})
