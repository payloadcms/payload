import { createServerFeature } from '../../../utilities/createServerFeature.js'

export const TestRecorderFeature = createServerFeature({
  feature: {
    ClientFeature: '../../../exports/client/index.js#TestRecorderFeatureClient',
  },
  key: 'testRecorder',
})
