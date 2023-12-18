import type { FeatureProvider } from '../../types'
import type { SlateNodeConverter } from './converter/types'

import { convertSlateToLexical } from './converter'
import { defaultSlateConverters } from './converter/defaultConverters'
import { UnknownConvertedNode } from './nodes/unknownConvertedNode'

type Props = {
  converters?:
    | (({ defaultConverters }: { defaultConverters: SlateNodeConverter[] }) => SlateNodeConverter[])
    | SlateNodeConverter[]
}

export const SlateToLexicalFeature = (props?: Props): FeatureProvider => {
  if (!props) {
    props = {}
  }

  props.converters =
    props?.converters && typeof props?.converters === 'function'
      ? props.converters({ defaultConverters: defaultSlateConverters })
      : (props?.converters as SlateNodeConverter[]) || defaultSlateConverters

  return {
    feature: () => {
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
              converters: props.converters as SlateNodeConverter[],
              slateData: incomingEditorState,
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
    key: 'slateToLexical',
  }
}
