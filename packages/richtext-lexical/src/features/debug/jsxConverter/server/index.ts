import { createServerFeature } from '../../../../utilities/createServerFeature.js'

export const DebugJsxConverterFeature = createServerFeature({
  feature: {
    ClientFeature: '@payloadcms/richtext-lexical/client#DebugJsxConverterFeatureClient',
  },
  key: 'jsxConverter',
})
