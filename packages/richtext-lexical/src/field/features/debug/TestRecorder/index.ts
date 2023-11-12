import type { FeatureProvider } from '../../types'

import { TestRecorderPlugin } from './plugin'

export const TestRecorderFeature = (): FeatureProvider => {
  return {
    feature: () => {
      return {
        plugins: [
          {
            Component: TestRecorderPlugin,
            position: 'bottom',
          },
        ],
        props: null,
      }
    },
    key: 'debug-testrecorder',
  }
}
