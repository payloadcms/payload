import { createServerFeature } from '../../../../utilities/createServerFeature.js'

export const DebugJsxConverterFeature = createServerFeature({
  feature: {
    ClientFeature: '@ruya.sa/richtext-lexical/client#DebugJsxConverterFeatureClient',
  },
  key: 'jsxConverter',
})
