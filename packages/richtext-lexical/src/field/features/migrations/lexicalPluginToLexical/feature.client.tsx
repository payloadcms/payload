'use client'

import type { FeatureProviderProviderClient } from '../../types.js'
import type { LexicalPluginNodeConverter, PayloadPluginLexicalData } from './converter/types.js'

import { createClientComponent } from '../../createClientComponent.js'
import { convertLexicalPluginToLexical } from './converter/index.js'
import { UnknownConvertedNode } from './nodes/unknownConvertedNode/index.js'

const LexicalPluginToLexicalFeatureClient: FeatureProviderProviderClient<null> = (props) => {
  return {
    clientFeatureProps: props,
    feature: ({ clientFunctions, resolvedFeatures }) => {
      const converters: LexicalPluginNodeConverter[] = Object.values(clientFunctions)

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
