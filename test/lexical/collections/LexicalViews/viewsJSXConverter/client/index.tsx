'use client'

import { createClientFeature } from '@payloadcms/richtext-lexical/client'

import type { DebugViewsJSXConverterFeatureProps } from '../server/index.js'

import { RichTextPlugin } from './plugin/index.js'

export const DebugViewsJsxConverterFeatureClient = createClientFeature<
  DebugViewsJSXConverterFeatureProps,
  DebugViewsJSXConverterFeatureProps
>({
  plugins: [
    {
      Component: RichTextPlugin,
      position: 'bottom',
    },
  ],
})
