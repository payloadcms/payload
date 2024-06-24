'use client'

import type { FeatureProviderProviderClient } from '../../types.js'
import type { SlateNodeConverter } from './converter/types.js'

import { createClientComponent } from '../../createClientComponent.js'
import { convertSlateToLexical } from './converter/index.js'
import { UnknownConvertedNode } from './nodes/unknownConvertedNode/index.js'

const SlateToLexicalFeatureClient: FeatureProviderProviderClient<undefined> = (props) => {
  return {
    clientFeatureProps: props,
    feature: ({ clientFunctions }) => {
      const converters: SlateNodeConverter[] = Object.values(clientFunctions)

      return {
        clientFeatureProps: props,
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
    },
  }
}

export const SlateToLexicalFeatureClientComponent = createClientComponent(
  SlateToLexicalFeatureClient,
)
