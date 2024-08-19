'use client'

import { createClientFeature } from '../../../utilities/createClientFeature.js'
import { UnknownConvertedNode } from './nodes/unknownConvertedNode/index.js'

export const SlateToLexicalFeatureClient = createClientFeature(({ clientFunctions }) => {
  return {
    nodes: [UnknownConvertedNode],
  }
})
