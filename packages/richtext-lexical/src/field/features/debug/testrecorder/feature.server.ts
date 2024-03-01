import type { FeatureProviderProviderServer } from '../../types'

import { TestRecorderFeatureClientComponent } from './feature.client'

export const TestRecorderFeature: FeatureProviderProviderServer<undefined, undefined> = (props) => {
  return {
    feature: () => {
      return {
        ClientComponent: TestRecorderFeatureClientComponent,
        serverFeatureProps: props,
      }
    },
    key: 'testrecorder',
    serverFeatureProps: props,
  }
}
