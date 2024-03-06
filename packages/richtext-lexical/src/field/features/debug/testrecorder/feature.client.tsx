'use client'
import type { FeatureProviderProviderClient } from '../../types.js'

import { createClientComponent } from '../../createClientComponent.js'
import { TestRecorderPlugin } from './plugin/index.js'

const TestRecorderFeatureClient: FeatureProviderProviderClient<undefined> = (props) => {
  return {
    clientFeatureProps: props,
    feature: () => ({
      clientFeatureProps: props,
      plugins: [
        {
          Component: TestRecorderPlugin,
          position: 'bottom',
        },
      ],
    }),
  }
}

export const TestRecorderFeatureClientComponent = createClientComponent(TestRecorderFeatureClient)
