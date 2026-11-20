import {
  BOLD_ITALIC_STAR,
  BOLD_ITALIC_UNDERSCORE,
  BOLD_STAR,
  BOLD_UNDERSCORE,
} from '@lexical/markdown'

import { createServerFeature } from '../../../utilities/createServerFeature.js'
import { i18n } from './i18n.js'

export const BoldFeature = createServerFeature({
  dependenciesSoft: ['italic'],
  feature: ({ featureProviderMap }) => {
    const markdownTransformers = [BOLD_STAR, BOLD_UNDERSCORE]
    if (featureProviderMap.get('italic')) {
      markdownTransformers.push(BOLD_ITALIC_UNDERSCORE, BOLD_ITALIC_STAR)
    }

    return {
      ClientFeature: '@payloadcms/richtext-lexical/client#BoldFeatureClient',
      i18n,
      markdownTransformers,
    }
  },
  key: 'bold',
})
