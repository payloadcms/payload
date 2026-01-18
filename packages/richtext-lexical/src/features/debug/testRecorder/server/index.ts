import { createServerFeature } from '../../../../utilities/createServerFeature.js'

export const TestRecorderFeature = createServerFeature({
  feature: {
    ClientFeature: '@ruya.sa/richtext-lexical/client#TestRecorderFeatureClient',
  },
  key: 'testRecorder',
})
