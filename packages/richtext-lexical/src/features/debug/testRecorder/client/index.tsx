'use client'

import { createClientFeature } from '../../../../utilities/createClientFeature.js'
import { TestRecorderPlugin } from './plugin/index.js'

export const TestRecorderFeatureClient = createClientFeature({
  plugins: [
    {
      Component: TestRecorderPlugin,
      position: 'bottom',
    },
  ],
})
