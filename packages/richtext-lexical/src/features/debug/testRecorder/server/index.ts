import { createServerFeature } from '../../../../utilities/createServerFeature.js'

export const TestRecorderFeature = createServerFeature({
  feature: {
    ClientFeature: '@payloadcms/richtext-lexical/client#TestRecorderFeatureClient',
  },
  key: 'testRecorder',
})
