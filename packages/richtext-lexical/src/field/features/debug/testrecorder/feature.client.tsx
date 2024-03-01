'use client'
import type { FeatureProviderProviderClient } from '../../types'

import { createClientComponent } from '../../createClientComponent'
import { TestRecorderPlugin } from './plugin'

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
