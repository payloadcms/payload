// eslint-disable-next-line payload/no-imports-from-exports-dir
import { AlignFeatureClient } from '../../exports/client/index.js'
import { createServerFeature } from '../../utilities/createServerFeature.js'
import { i18n } from './i18n.js'

export const AlignFeature = createServerFeature({
  feature: {
    ClientFeature: AlignFeatureClient,
    i18n,
  },
  key: 'align',
})
