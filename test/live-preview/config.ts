import { fileURLToPath } from 'node:url'
import path from 'path'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import Categories from './collections/Categories.js'
import { Media } from './collections/Media.js'
import { Pages } from './collections/Pages.js'
import { Posts } from './collections/Posts.js'
import { SSR } from './collections/SSR.js'
import { SSRAutosave } from './collections/SSRAutosave.js'
import { Tenants } from './collections/Tenants.js'
import { Users } from './collections/Users.js'
import { Footer } from './globals/Footer.js'
import { Header } from './globals/Header.js'
import { seed } from './seed/index.js'
import {
  desktopBreakpoint,
  mobileBreakpoint,
  pagesSlug,
  postsSlug,
  ssrAutosavePagesSlug,
  ssrPagesSlug,
} from './shared.js'
import { formatLivePreviewURL } from './utilities/formatLivePreviewURL.js'

export default buildConfigWithDefaults({
  localization: {
    defaultLocale: 'en',
    locales: ['en', 'es'],
  },
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
    livePreview: {
      // You can define any of these properties on a per collection or global basis
      // The Live Preview config cascades from the top down, properties are inherited from here
      url: formatLivePreviewURL,
      breakpoints: [mobileBreakpoint, desktopBreakpoint],
      collections: [pagesSlug, postsSlug, ssrPagesSlug, ssrAutosavePagesSlug],
      globals: ['header', 'footer'],
    },
  },
  cors: ['http://localhost:3000', 'http://localhost:3001'],
  csrf: ['http://localhost:3000', 'http://localhost:3001'],
  collections: [Users, Pages, Posts, SSR, SSRAutosave, Tenants, Categories, Media],
  globals: [Header, Footer],
  onInit: seed,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
