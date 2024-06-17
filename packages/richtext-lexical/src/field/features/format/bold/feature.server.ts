import type { FeatureProviderProviderServer } from '../../types.js'

// eslint-disable-next-line payload/no-imports-from-exports-dir
import { BoldFeatureClientComponent } from '../../../../exports/client/index.js'
import {
  BOLD_ITALIC_STAR,
  BOLD_ITALIC_UNDERSCORE,
  BOLD_STAR,
  BOLD_UNDERSCORE,
} from './markdownTransformers.js'

export const BoldFeature: FeatureProviderProviderServer<undefined, undefined> = (props) => {
  return {
    dependenciesSoft: ['italic'],
    feature: ({ featureProviderMap }) => {
      const markdownTransformers = [BOLD_STAR, BOLD_UNDERSCORE]
      if (featureProviderMap.get('italic')) {
        markdownTransformers.push(BOLD_ITALIC_UNDERSCORE, BOLD_ITALIC_STAR)
      }

      return {
        ClientComponent: BoldFeatureClientComponent,
        markdownTransformers,
        serverFeatureProps: props,
      }
    },
    key: 'bold',
    serverFeatureProps: props,
  }
}
