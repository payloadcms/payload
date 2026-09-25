import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { CategoriesCollection } from './collections/Categories/index.js'
import { MediaCollection } from './collections/Media/index.js'
import { NoGroupableCollection } from './collections/NoGroupable/index.js'
import { PagesCollection } from './collections/Pages/index.js'
import { PostsCollection } from './collections/Posts/index.js'
import { RelationshipsCollection } from './collections/Relationships/index.js'
import { seed } from './seed.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfigWithDefaults({
  suite: 'group-by',
  config: {
    admin: {
      importMap: {
        baseDir: path.resolve(dirname),
      },
    },
    collections: [
      PagesCollection,
      PostsCollection,
      CategoriesCollection,
      MediaCollection,
      RelationshipsCollection,
      NoGroupableCollection,
    ],
    editor: lexicalEditor({}),
    typescript: {
      outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
  },
  seed,
})
