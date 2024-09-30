import type { SlateNodeConverter } from './converter/types.js'

import { createServerFeature } from '../../../utilities/createServerFeature.js'
import { defaultSlateConverters } from './converter/defaultConverters.js'
import { convertSlateToLexical } from './converter/index.js'
import { UnknownConvertedNode } from './nodes/unknownConvertedNode/index.js'

export type SlateToLexicalFeatureProps = {
  converters?:
    | (({ defaultConverters }: { defaultConverters: SlateNodeConverter[] }) => SlateNodeConverter[])
    | SlateNodeConverter[]
  disableHooks?: boolean
}

export const SlateToLexicalFeature = createServerFeature<
  SlateToLexicalFeatureProps,
  {
    converters?: SlateNodeConverter[]
  }
>({
  feature: ({ props }) => {
    if (!props) {
      props = {}
    }

    let converters: SlateNodeConverter[] = []
    if (props?.converters && typeof props?.converters === 'function') {
      converters = props.converters({ defaultConverters: defaultSlateConverters })
    } else if (props.converters && typeof props?.converters !== 'function') {
      converters = props.converters
    } else {
      converters = defaultSlateConverters
    }

    props.converters = converters

    return {
      ClientFeature: '@payloadcms/richtext-lexical/client#SlateToLexicalFeatureClient',
      hooks: props.disableHooks
        ? undefined
        : {
            afterRead: [
              ({ value }) => {
                if (!value || !Array.isArray(value) || 'root' in value) {
                  // incomingEditorState null or not from Slate
                  return value
                }

                // Slate => convert to lexical
                return convertSlateToLexical({
                  converters: props.converters as SlateNodeConverter[],
                  slateData: value,
                })
              },
            ],
          },
      nodes: [
        {
          node: UnknownConvertedNode,
        },
      ],
      sanitizedServerFeatureProps: {
        converters,
      },
    }
  },
  key: 'slateToLexical',
})
