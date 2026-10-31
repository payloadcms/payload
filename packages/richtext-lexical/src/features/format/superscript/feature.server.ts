import { createServerFeature } from '../../../utilities/createServerFeature.js'
import { i18n } from './i18n.js'

export const SuperscriptFeature = createServerFeature({
  feature: {
    ClientFeature: '@payloadcms/richtext-lexical/client#SuperscriptFeatureClient',
    i18n,
  },
  key: 'superscript',
})
