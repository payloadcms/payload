import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { Media } from './collections/media.js'

export default buildConfigWithDefaults({
  config: {
    collections: [Media],
    localization: { defaultLocale: 'en', locales: ['en', 'fr'] },
  },
  suite: 'version-selector-uploads',
})
