import type { FeatureProvider } from '../../types'
import type { LexicalPluginNodeConverter, PayloadPluginLexicalData } from './converter/types'

import { convertLexicalPluginToLexical } from './converter'
import { defaultConverters } from './converter/defaultConverters'
import { UnknownConvertedNode } from './nodes/unknownConvertedNode'

type Props = {
  converters?:
    | (({
        defaultConverters,
      }: {
        defaultConverters: LexicalPluginNodeConverter[]
      }) => LexicalPluginNodeConverter[])
    | LexicalPluginNodeConverter[]
}

export const LexicalPluginToLexicalFeature = (props?: Props): FeatureProvider => {
  if (!props) {
    props = {}
  }

  props.converters =
    props?.converters && typeof props?.converters === 'function'
      ? props.converters({ defaultConverters: defaultConverters })
      : (props?.converters as LexicalPluginNodeConverter[]) || defaultConverters

  return {
    feature: ({ resolvedFeatures, unsanitizedEditorConfig }) => {
      return {
        hooks: {
          load({ incomingEditorState }) {
            if (!incomingEditorState || !('jsonContent' in incomingEditorState)) {
              // incomingEditorState null or not from Lexical Plugin
              return incomingEditorState
            }
            // Lexical Plugin => convert to lexical

            return convertLexicalPluginToLexical({
              converters: props.converters as LexicalPluginNodeConverter[],
              lexicalPluginData: incomingEditorState as unknown as PayloadPluginLexicalData,
            })
          },
        },
        nodes: [
          {
            node: UnknownConvertedNode,
            type: UnknownConvertedNode.getType(),
          },
        ],
        props,
      }
    },
    key: 'lexicalPluginToLexical',
  }
}
