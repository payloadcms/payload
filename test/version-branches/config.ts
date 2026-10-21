import { fileURLToPath } from 'node:url'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { Articles } from './collections/Articles/index.js'
import { Settings } from './globals/Settings/index.js'

export default buildConfigWithDefaults({
  config: {
    collections: [Articles],
    globals: [Settings],
    localization: { defaultLocale: 'en', fallback: false, locales: ['en', 'fr'] },
    typescript: { outputFile: fileURLToPath(new URL('./payload-types.ts', import.meta.url)) },
  },
  disableMCP: true,
  suite: 'version-branches',
})
