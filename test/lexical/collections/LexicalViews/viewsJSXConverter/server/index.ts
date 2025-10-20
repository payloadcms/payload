import { createServerFeature } from '@payloadcms/richtext-lexical'

export const DebugViewsJSXConverterFeature = createServerFeature({
  feature: {
    ClientFeature:
      './collections/LexicalViews/viewsJSXConverter/client/index.js#DebugViewsJsxConverterFeatureClient',
  },
  key: 'jsxViewsConverter',
})
