import { fileURLToPath } from 'node:url'

// eslint-disable-next-line payload/no-relative-monorepo-imports -- Register internal head storage only in the experimental integration fixture.
import { buildBranchHeadCollection } from '../../packages/payload/src/versions/branches/storage/buildBranchHeadCollection.js'
import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { databaseAdapter } from '../databaseAdapter.js'
import { Articles } from './collections/Articles/index.js'
import { ProtectedArticles } from './collections/ProtectedArticles/index.js'
import { Settings } from './globals/Settings/index.js'
import { articleHeadsSlug, articlesSlug, settingsHeadsSlug } from './slugs.js'

export default buildConfigWithDefaults({
  config: {
    collections: [
      Articles,
      ProtectedArticles,
      buildBranchHeadCollection({
        parentCollection: articlesSlug,
        slug: articleHeadsSlug,
        versionIDType: databaseAdapter.defaultIDType,
      }),
      buildBranchHeadCollection({
        slug: settingsHeadsSlug,
        versionIDType: databaseAdapter.defaultIDType,
      }),
    ],
    globals: [Settings],
    jobs: { deleteJobOnComplete: false },
    localization: { defaultLocale: 'en', fallback: false, locales: ['en', 'fr'] },
    typescript: { outputFile: fileURLToPath(new URL('./payload-types.ts', import.meta.url)) },
  },
  disableMCP: true,
  suite: 'version-branches',
})
