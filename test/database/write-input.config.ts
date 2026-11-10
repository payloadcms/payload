import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { WriteInput } from './collections/WriteInput/index.js'

export default buildConfigWithDefaults({
  config: {
    collections: [WriteInput],
    localization: { defaultLocale: 'en', locales: ['en', 'fr'] },
    typescript: { autoGenerate: false },
  },
  suite: 'database',
})
