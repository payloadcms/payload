import { INLINE_CODE } from '@lexical/markdown'

import { createServerFeature } from '../../../utilities/createServerFeature.js'
import { i18n } from './i18n.js'

export const InlineCodeFeature = createServerFeature({
  feature: {
    ClientFeature: '@payloadcms/richtext-lexical/client#InlineCodeFeatureClient',
    i18n,
    markdownTransformers: [INLINE_CODE],
  },
  key: 'inlineCode',
})
