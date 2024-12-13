'use client'
import { createClientFeature } from '@payloadcms/richtext-lexical/client'
import { SEOPlugin } from './plugin.js'
import { LengthIndicatorPlugin } from './LengthIndicatorPlugin.js'

export const SEOFeature = createClientFeature({
  plugins: [
    {
      Component: SEOPlugin,
      position: 'aboveContainer',
    },
    {
      Component: LengthIndicatorPlugin,
      position: 'belowContainer',
    },
  ],
})
