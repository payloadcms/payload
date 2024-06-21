'use client'

import type { FeatureProviderProviderClient } from '../../types.js'

import { createClientComponent } from '../../createClientComponent.js'
import { InlineToolbarPlugin } from './Toolbar/index.js'

const InlineToolbarFeatureClient: FeatureProviderProviderClient<undefined> = (props) => {
  return {
    clientFeatureProps: props,
    feature: () => ({
      plugins: [
        {
          Component: InlineToolbarPlugin,
          position: 'floatingAnchorElem',
        },
      ],
      sanitizedClientFeatureProps: props,
    }),
  }
}

export const InlineToolbarFeatureClientComponent = createClientComponent(InlineToolbarFeatureClient)
