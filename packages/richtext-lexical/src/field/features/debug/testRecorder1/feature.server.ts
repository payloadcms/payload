import type { FeatureProviderProviderServer } from '../../types.js'

import { TestRecorderFeatureClientComponent } from './feature.client.js'

export const TestRecorderFeature: FeatureProviderProviderServer<undefined, undefined> = (props) => {
  return {
    feature: () => {
      return {
        ClientComponent: TestRecorderFeatureClientComponent,
        serverFeatureProps: props,
      }
    },
    key: 'testRecorder',
    serverFeatureProps: props,
  }
}
