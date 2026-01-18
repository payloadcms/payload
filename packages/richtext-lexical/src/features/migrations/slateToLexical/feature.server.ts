import type { SlateNodeConverter } from './converter/types.js'

import { createServerFeature } from '../../../utilities/createServerFeature.js'
import { defaultSlateConverters } from './converter/defaultConverters.js'
import { convertSlateToLexical } from './converter/index.js'
import { UnknownConvertedNode } from './nodes/unknownConvertedNode/index.js'

export type SlateToLexicalFeatureProps = {
  /**
   * Custom converters to transform Slate nodes to Lexical nodes.
   * Can be an array of converters or a function that receives default converters and returns an array.
   * @default defaultSlateConverters
   */
  converters?:
    | (({ defaultConverters }: { defaultConverters: SlateNodeConverter[] }) => SlateNodeConverter[])
    | SlateNodeConverter[]
  /**
   * When true, disables the afterRead hook that converts Slate data on-the-fly.
   * Set this to true when running the migration script. That way, this feature is only used
   * to "pass through" the converters to the migration script.
   * @default false
   */
  disableHooks?: boolean
}

/**
 * Enables on-the-fly conversion of Slate data to Lexical format through an afterRead hook.
 * Used for testing migrations before running the permanent migration script.
 * Only converts data that is in Slate format (arrays); Lexical data passes through unchanged.
 *
 * @example
 * ```ts
 * lexicalEditor({
 *   features: ({ defaultFeatures }) => [
 *     ...defaultFeatures,
 *     SlateToLexicalFeature({
 *       converters: [...defaultSlateConverters, MyCustomConverter],
 *       disableHooks: false, // Set to true during migration script
 *     }),
 *   ],
 * })
 * ```
 */
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
      ClientFeature: '@ruya.sa/richtext-lexical/client#SlateToLexicalFeatureClient',
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
