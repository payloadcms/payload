import { createServerFeature } from '../../../utilities/createServerFeature.js'
import { i18n } from './i18n.js'

export const AlignFeature = createServerFeature({
  feature: {
    ClientFeature: '@ruya.sa/richtext-lexical/client#AlignFeatureClient',
    i18n,
  },
  key: 'align',
})
