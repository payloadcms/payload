import type { RichTextAdapter } from 'payload/types'

import { withMergedProps, withNullableJSONSchemaType } from 'payload/utilities'

import type { AdapterArguments } from './types'

import RichTextCell from './cell'
import { richTextRelationshipPromise } from './data/richTextRelationshipPromise'
import { richTextValidate } from './data/validation'
import RichTextField from './field'

export function slateEditor(args: AdapterArguments): RichTextAdapter<any[], AdapterArguments, any> {
  return {
    CellComponent: withMergedProps({
      Component: RichTextCell,
      toMergeIntoProps: args,
    }),
    FieldComponent: withMergedProps({
      Component: RichTextField,
      toMergeIntoProps: args,
    }),
    outputSchema: ({ isRequired }) => {
      return {
        type: withNullableJSONSchemaType('array', isRequired),
        items: {
          type: 'object',
        },
      }
    },
    populationPromise({
      context,
      currentDepth,
      depth,
      draft,
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
          draft,
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
