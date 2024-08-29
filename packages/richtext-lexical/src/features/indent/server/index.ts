import { createServerFeature } from '../../../utilities/createServerFeature.js'
import { i18n } from './i18n.js'

export const IndentFeature = createServerFeature({
  feature: {
    ClientFeature: '@payloadcms/richtext-lexical/client#IndentFeatureClient',
    i18n,
  },
  key: 'indent',
})
