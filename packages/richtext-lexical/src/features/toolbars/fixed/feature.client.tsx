'use client'

import type { FixedToolbarFeatureProps } from './feature.server.js'

import { createClientFeature } from '../../../utilities/createClientFeature.js'
import { FixedToolbarPlugin } from './Toolbar/index.js'

export const FixedToolbarFeatureClient = createClientFeature<FixedToolbarFeatureProps>({
  plugins: [
    {
      Component: FixedToolbarPlugin,
      position: 'aboveContainer',
    },
  ],
})
