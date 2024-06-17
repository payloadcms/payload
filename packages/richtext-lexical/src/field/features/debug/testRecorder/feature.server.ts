import type { FeatureProviderProviderServer } from '../../types.js'

// eslint-disable-next-line payload/no-imports-from-exports-dir
import { TestRecorderFeatureClientComponent } from '../../../../exports/client/index.js'

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
