'use client'

import { createClientFeature } from '../../../../utilities/createClientFeature.js'
import { InlineToolbarPlugin } from './Toolbar/index.js'

export const InlineToolbarFeatureClient = createClientFeature({
  plugins: [
    {
      Component: InlineToolbarPlugin,
      position: 'floatingAnchorElem',
    },
  ],
})
