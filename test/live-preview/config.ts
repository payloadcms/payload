import { fileURLToPath } from 'node:url'
import path from 'path'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { MediaBlock } from './blocks/MediaBlock/index.js'
import { Categories } from './collections/Categories.js'
import { CollectionLevelConfig } from './collections/CollectionLevelConfig.js'
import { ConditionalURL } from './collections/ConditionalURL.js'
import { CustomLivePreview } from './collections/CustomLivePreview.js'
import { Media } from './collections/Media.js'
import { OpenByDefault } from './collections/OpenByDefault.js'
import { Pages } from './collections/Pages.js'
import { Posts } from './collections/Posts.js'
import { SSR } from './collections/SSR.js'
import { SSRAutosave } from './collections/SSRAutosave.js'
import { StaticURLCollection } from './collections/StaticURL.js'
import { Tenants } from './collections/Tenants.js'
import { Users } from './collections/Users.js'
import { Footer } from './globals/Footer.js'
import { Header } from './globals/Header.js'
import { seed } from './seed/index.js'
import {
  customLivePreviewSlug,
  desktopBreakpoint,
  mobileBreakpoint,
  pagesSlug,
  postsSlug,
  ssrAutosavePagesSlug,
  ssrPagesSlug,
} from './shared.js'
import { formatLivePreviewURL } from './utilities/formatLivePreviewURL.js'

export default buildConfigWithDefaults({
  suite: 'live-preview',
  config: {
    admin: {
      importMap: {
        baseDir: path.resolve(dirname),
      },
      livePreview: {
        // You can define any of these properties on a per collection or global basis
        // The Live Preview config cascades from the top down, properties are inherited from here
        breakpoints: [mobileBreakpoint, desktopBreakpoint],
        collections: [
          pagesSlug,
          postsSlug,
          ssrPagesSlug,
          ssrAutosavePagesSlug,
          customLivePreviewSlug,
        ],
        globals: ['header', 'footer'],
        url: formatLivePreviewURL,
      },
    },
    blocks: [MediaBlock],
    collections: [
      Users,
      Pages,
      Posts,
      SSR,
      SSRAutosave,
      Tenants,
      Categories,
      Media,
      CollectionLevelConfig,
      OpenByDefault,
      StaticURLCollection,
      CustomLivePreview,
      ConditionalURL,
    ],
    cors: [`http://localhost:${process.env.PORT || 3000}`, 'http://localhost:3001'],
    csrf: [`http://localhost:${process.env.PORT || 3000}`, 'http://localhost:3001'],
    globals: [Header, Footer],
    localization: {
      defaultLocale: 'en',
      locales: ['en', 'es'],
    },
    typescript: {
      outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
  },
  seed,
})
