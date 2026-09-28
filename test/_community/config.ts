import { FixedToolbarFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { Articles } from './collections/Articles/index.js'
import { Authors } from './collections/Authors/index.js'
import { Categories } from './collections/Categories/index.js'
import { Events } from './collections/Events/index.js'
import { Experiments } from './collections/Experiments/index.js'
import { FoldersCollection } from './collections/Folders/index.js'
import { MediaCollection } from './collections/Media/index.js'
import { PagesCollection } from './collections/Pages/index.js'
import { PostsCollection } from './collections/Posts/index.js'
import { Products } from './collections/Products/index.js'
import { Users } from './collections/Users/index.js'
import { MenuGlobal } from './globals/Menu/index.js'
import { PlaygroundSettings } from './globals/PlaygroundSettings/index.js'
import { seedCommunity } from './seed.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfigWithDefaults({
  config: {
    admin: {
      dashboard: {
        defaultLayout: [
          { widgetSlug: 'welcome', width: 'full' },
          { widgetSlug: 'activity', width: 'full' },
          { widgetSlug: 'collections', width: 'full' },
        ],
        widgets: [],
      },
      importMap: {
        baseDir: path.resolve(dirname),
      },
      meta: { titleSuffix: ' · Payload Playground' },
      user: Users.slug,
    },
    collections: [
      MediaCollection,
      Users,
      Authors,
      Categories,
      Articles,
      Products,
      Events,
      Experiments,
      PagesCollection,
      FoldersCollection,
      PostsCollection,
    ],
    editor: lexicalEditor({
      features: ({ defaultFeatures }) => [...defaultFeatures, FixedToolbarFeature()],
    }),
    globals: [PlaygroundSettings, MenuGlobal],
    localization: {
      defaultLocale: 'en',
      fallback: true,
      locales: [
        { code: 'en', label: 'English' },
        { code: 'es', label: 'Spanish' },
      ],
    },
    typescript: {
      outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
  },
  seed: seedCommunity,
  suite: '_community',
})
