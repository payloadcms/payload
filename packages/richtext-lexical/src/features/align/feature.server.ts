import { createServerFeature } from '../../utilities/createServerFeature.js'
import { i18n } from './i18n.js'

export const AlignFeature = createServerFeature({
  feature: {
    ClientFeature: '../../exports/client/index.js#AlignFeatureClient',
    i18n,
  },
  key: 'align',
})
