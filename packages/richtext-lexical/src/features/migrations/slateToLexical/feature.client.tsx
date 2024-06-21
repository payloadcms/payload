'use client'

import type { SlateNodeConverter } from './converter/types.js'

import { createClientFeature } from '../../../utilities/createClientFeature.js'
import { convertSlateToLexical } from './converter/index.js'
import { UnknownConvertedNode } from './nodes/unknownConvertedNode/index.js'

export const SlateToLexicalFeatureClient = createClientFeature(({ clientFunctions }) => {
  const converters: SlateNodeConverter[] = Object.values(clientFunctions)

  return {
    hooks: {
      load({ incomingEditorState }) {
        if (
          !incomingEditorState ||
          !Array.isArray(incomingEditorState) ||
          'root' in incomingEditorState
        ) {
          // incomingEditorState null or not from Slate
          return incomingEditorState
        }
        // Slate => convert to lexical

        return convertSlateToLexical({
          converters,
          slateData: incomingEditorState,
        })
      },
    },
    nodes: [UnknownConvertedNode],
  }
})
