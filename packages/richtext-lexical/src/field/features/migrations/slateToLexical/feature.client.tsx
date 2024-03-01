'use client'

import type { FeatureProviderProviderClient } from '../../types'
import type { SlateNodeConverter } from './converter/types'

import { createClientComponent } from '../../createClientComponent'
import { convertSlateToLexical } from './converter'
import { UnknownConvertedNode } from './nodes/unknownConvertedNode'

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
