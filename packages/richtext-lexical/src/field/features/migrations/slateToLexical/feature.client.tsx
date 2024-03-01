'use client'

import type { FeatureProviderProviderClient } from '../../types'
import type { SlateNodeConverter } from './converter/types'

import { createClientComponent } from '../../createClientComponent'
import { convertSlateToLexical } from './converter'
import { UnknownConvertedNode } from './nodes/unknownConvertedNode'

export type SlateToLexicalFeatureClientProps = {
  converters: SlateNodeConverter[]
}

const SlateToLexicalFeatureClient: FeatureProviderProviderClient<
  SlateToLexicalFeatureClientProps
> = (props) => {
  return {
    clientFeatureProps: props,
    feature: () => ({
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
            converters: props.converters,
            slateData: incomingEditorState,
          })
        },
      },
      nodes: [UnknownConvertedNode],
    }),
  }
}

export const SlateToLexicalFeatureClientComponent = createClientComponent(
  SlateToLexicalFeatureClient,
)
