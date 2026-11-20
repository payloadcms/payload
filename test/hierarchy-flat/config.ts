import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { seed } from './seed.js'
import { Articles } from './collections/Articles/index.js'
import { Folders } from './collections/Folders/index.js'
import { Pages } from './collections/Pages/index.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export default buildConfigWithDefaults({
  config: {
    admin: { importMap: { baseDir: dirname } },
    collections: [{ slug: 'users', auth: true, fields: [] }, Folders, Pages, Articles],
    typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  },
  seed,
  suite: 'hierarchy-flat',
})
