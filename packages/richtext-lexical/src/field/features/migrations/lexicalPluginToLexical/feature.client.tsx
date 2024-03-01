'use client'

import type { FeatureProviderProviderClient } from '../../types'
import type { PayloadPluginLexicalData } from './converter/types'

import { createClientComponent } from '../../createClientComponent'
import { convertLexicalPluginToLexical } from './converter'
import { UnknownConvertedNode } from './nodes/unknownConvertedNode'

const LexicalPluginToLexicalFeatureClient: FeatureProviderProviderClient<null> = (props) => {
  return {
    clientFeatureProps: props,
    feature: ({ clientFunctions, resolvedFeatures }) => {
      const converters = Object.values(clientFunctions)

      return {
        clientFeatureProps: props,
        hooks: {
          load({ incomingEditorState }) {
            if (!incomingEditorState || !('jsonContent' in incomingEditorState)) {
              // incomingEditorState null or not from Lexical Plugin
              return incomingEditorState
            }
            // Lexical Plugin => convert to lexical

            return convertLexicalPluginToLexical({
              converters,
              lexicalPluginData: incomingEditorState as unknown as PayloadPluginLexicalData,
            })
          },
        },
        nodes: [UnknownConvertedNode],
      }
    },
  }
}

export const LexicalPluginToLexicalFeatureClientComponent = createClientComponent(
  LexicalPluginToLexicalFeatureClient,
)
