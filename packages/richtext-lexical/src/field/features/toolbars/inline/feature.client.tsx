'use client'

import type { FeatureProviderProviderClient } from '../../types.js'

import { createClientComponent } from '../../createClientComponent.js'
import { InlineToolbarPlugin } from './Toolbar/index.js'

const InlineToolbarFeatureClient: FeatureProviderProviderClient<undefined> = (props) => {
  return {
    clientFeatureProps: props,
    feature: () => ({
      clientFeatureProps: props,
      plugins: [
        {
          Component: InlineToolbarPlugin,
          position: 'floatingAnchorElem',
        },
      ],
    }),
  }
}

export const InlineToolbarFeatureClientComponent = createClientComponent(InlineToolbarFeatureClient)
