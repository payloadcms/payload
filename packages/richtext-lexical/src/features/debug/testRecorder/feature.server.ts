// eslint-disable-next-line payload/no-imports-from-exports-dir
import { TestRecorderFeatureClient } from '../../../exports/client/index.js'
import { createServerFeature } from '../../../utilities/createServerFeature.js'

export const TestRecorderFeature = createServerFeature({
  feature: {
    ClientFeature: TestRecorderFeatureClient,
  },
  key: 'testRecorder',
})
