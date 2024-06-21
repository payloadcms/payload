// eslint-disable-next-line payload/no-imports-from-exports-dir
import { ParagraphFeatureClient } from '../../exports/client/index.js'
import { createServerFeature } from '../../utilities/createServerFeature.js'
import { i18n } from './i18n.js'

export const ParagraphFeature = createServerFeature({
  feature: {
    ClientFeature: ParagraphFeatureClient,
    clientFeatureProps: null,
    i18n,
  },
  key: 'paragraph',
})
