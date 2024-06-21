'use client'

import type { FeatureProviderProviderClient } from '../../types.js'
import type { FixedToolbarFeatureProps } from './feature.server.js'

import { createClientComponent } from '../../createClientComponent.js'
import { FixedToolbarPlugin } from './Toolbar/index.js'

const FixedToolbarFeatureClient: FeatureProviderProviderClient<FixedToolbarFeatureProps> = (
  props,
) => {
  return {
    clientFeatureProps: props,
    feature: {
      plugins: [
        {
          Component: FixedToolbarPlugin,
          position: 'aboveContainer',
        },
      ],
      sanitizedClientFeatureProps: props,
    },
  }
}

export const FixedToolbarFeatureClientComponent = createClientComponent(FixedToolbarFeatureClient)
