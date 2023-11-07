import type { JSONSchema4TypeName } from 'json-schema'
import type { RichTextAdapter } from 'payload/types'

import { withMergedProps } from 'payload/utilities'

import type { AdapterArguments } from './types'

import RichTextCell from './cell'
import { richTextRelationshipPromise } from './data/richTextRelationshipPromise'
import { richTextValidate } from './data/validation'
import RichTextField from './field'

export function slateEditor(
  args: AdapterArguments,
): RichTextAdapter<any[], AdapterArguments, AdapterArguments> {
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
        items: {
          type: 'object',
        },
        type: withNullableType('array', isRequired),
      }
    },
    populationPromise({
      currentDepth,
      depth,
      field,
      overrideAccess,
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
          currentDepth,
          depth,
          field,
          overrideAccess,
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

function withNullableType(
  fieldType: JSONSchema4TypeName,
  isRequired: boolean,
): JSONSchema4TypeName | JSONSchema4TypeName[] {
  const fieldTypes = [fieldType]
  if (isRequired) return fieldType
  fieldTypes.push('null')
  return fieldTypes
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
