'use client'

import { createClientFeature } from '../../../../utilities/createClientFeature.js'
import { RichTextPlugin } from './plugin/index.js'

export const DebugJsxConverterFeatureClient = createClientFeature({
  plugins: [
    {
      Component: RichTextPlugin,
      position: 'bottom',
    },
  ],
})
