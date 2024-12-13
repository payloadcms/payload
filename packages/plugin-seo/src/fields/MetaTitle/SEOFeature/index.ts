import { createServerFeature } from '@payloadcms/richtext-lexical'

export const SEOFeature = createServerFeature({
  key: 'seo',
  feature(props) {
    return {
      ClientFeature: '@payloadcms/plugin-seo/client#SEOFeature',
    }
  },
})
