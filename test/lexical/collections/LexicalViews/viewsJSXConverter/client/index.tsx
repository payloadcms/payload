'use client'

import { createClientFeature } from '@payloadcms/richtext-lexical/client'

import { RichTextPlugin } from './plugin/index.js'

export const DebugViewsJsxConverterFeatureClient = createClientFeature({
  plugins: [
    {
      Component: RichTextPlugin,
      position: 'bottom',
    },
  ],
})
