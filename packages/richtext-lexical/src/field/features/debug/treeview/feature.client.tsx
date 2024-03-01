'use client'
import type { FeatureProviderProviderClient } from '../../types'

import { createClientComponent } from '../../createClientComponent'
import { TreeViewPlugin } from './plugin'

const TreeViewFeatureClient: FeatureProviderProviderClient<undefined> = (props) => {
  return {
    clientFeatureProps: props,
    feature: () => ({
      clientFeatureProps: props,
      plugins: [
        {
          Component: TreeViewPlugin,
          position: 'bottom',
        },
      ],
    }),
  }
}

export const TreeViewFeatureClientComponent = createClientComponent(TreeViewFeatureClient)
