import type { RichTextAdapter } from 'payload/types'

import { withMergedProps, withNullableJSONSchemaType } from 'payload/utilities'

import type { AdapterArguments } from './types'

import RichTextCell from './cell'
import { richTextRelationshipPromise } from './data/richTextRelationshipPromise'
import { richTextValidate } from './data/validation'

export function slateEditor(
  args: AdapterArguments,
): RichTextAdapter<any[], AdapterArguments, AdapterArguments> {
  return {
    CellComponent: withMergedProps({
      Component: RichTextCell,
      toMergeIntoProps: args,
    }),
    FieldComponent: () =>
      // @ts-expect-error
      import('./field').then((module) => {
        const RichTextField = module.RichTextField
        return import('payload/utilities').then((module) =>
          module.withMergedProps({
            Component: RichTextField,
            toMergeIntoProps: args,
          }),
        )
      }),

    outputSchema: ({ isRequired }) => {
      return {
        items: {
          type: 'object',
        },
        type: withNullableJSONSchemaType('array', isRequired),
      }
    },
    populationPromise({
      context,
      currentDepth,
      depth,
      field,
      findMany,
      flattenLocales,
      overrideAccess,
      populationPromises,
      req,
      showHiddenFields,
      siblingDoc,
    }) {
      if (
        field.admin?.elements?.includes('relationship') ||
        field.admin?.elements?.includes('upload') ||
        field.admin?.elements?.includes('link') ||
        !field?.admin?.elements
      ) {
        return richTextRelationshipPromise({
          context,
          currentDepth,
          depth,
          field,
          findMany,
          flattenLocales,
          overrideAccess,
          populationPromises,
          req,
          showHiddenFields,
          siblingDoc,
        })
      }
      return null
    },
    validate: richTextValidate,
  }
}

export { default as ElementButton } from './field/elements/Button'

export { default as toggleElement } from './field/elements/toggle'
export { default as LeafButton } from './field/leaves/Button'
export type {
  AdapterArguments,
  ElementNode,
  FieldProps,
  RichTextCustomElement,
  RichTextCustomLeaf,
  RichTextElement,
  RichTextLeaf,
  TextNode,
} from './types'

export { nodeIsTextNode } from './types'
