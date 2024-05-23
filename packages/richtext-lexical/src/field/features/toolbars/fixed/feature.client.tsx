'use client'

import type { FeatureProviderProviderClient } from '../../types.js'

import { createClientComponent } from '../../createClientComponent.js'
import { FixedToolbarPlugin } from './Toolbar/index.js'

const FixedToolbarFeatureClient: FeatureProviderProviderClient<undefined> = (props) => {
  return {
    clientFeatureProps: props,
    feature: () => ({
      clientFeatureProps: props,
      plugins: [
        {
          Component: FixedToolbarPlugin,
          position: 'aboveContainer',
        },
      ],
    }),
  }
}

export const FixedToolbarFeatureClientComponent = createClientComponent(FixedToolbarFeatureClient)
