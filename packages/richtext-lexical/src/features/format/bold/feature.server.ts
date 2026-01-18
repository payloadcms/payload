import { createServerFeature } from '../../../utilities/createServerFeature.js'
import {
  BOLD_ITALIC_STAR,
  BOLD_ITALIC_UNDERSCORE,
  BOLD_STAR,
  BOLD_UNDERSCORE,
} from './markdownTransformers.js'

export const BoldFeature = createServerFeature({
  dependenciesSoft: ['italic'],
  feature: ({ featureProviderMap }) => {
    const markdownTransformers = [BOLD_STAR, BOLD_UNDERSCORE]
    if (featureProviderMap.get('italic')) {
      markdownTransformers.push(BOLD_ITALIC_UNDERSCORE, BOLD_ITALIC_STAR)
    }

    return {
      ClientFeature: '@payloadcms/richtext-lexical/client#BoldFeatureClient',
      markdownTransformers,
    }
  },
  key: 'bold',
})
