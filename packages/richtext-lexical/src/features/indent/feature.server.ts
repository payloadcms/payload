import { createServerFeature } from '../../utilities/createServerFeature.js'
import { i18n } from './i18n.js'

export const IndentFeature = createServerFeature({
  feature: {
    ClientFeature: '../../exports/client/index.js#IndentFeatureClient',
    i18n,
  },
  key: 'indent',
})
