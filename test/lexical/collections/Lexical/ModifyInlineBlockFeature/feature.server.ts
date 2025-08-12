import { createServerFeature } from '@payloadcms/richtext-lexical'

export const ModifyInlineBlockFeature = createServerFeature({
  key: 'ModifyInlineBlockFeature',
  feature: {
    ClientFeature:
      './collections/Lexical/ModifyInlineBlockFeature/feature.client.js#ModifyInlineBlockFeatureClient',
  },
})
