// eslint-disable-next-line payload/no-imports-from-exports-dir
import { IndentFeatureClient } from '../../exports/client/index.js'
import { createServerFeature } from '../../utilities/createServerFeature.js'
import { i18n } from './i18n.js'

export const IndentFeature = createServerFeature({
  feature: {
    ClientFeature: IndentFeatureClient,
    i18n,
  },
  key: 'indent',
})
