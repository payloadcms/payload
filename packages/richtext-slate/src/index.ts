import type { RichTextAdapter } from 'payload/types'

import { withMergedProps } from 'payload/components/utilities'

import type { AdapterArguments } from './types'

import RichTextCell from './cell'
import { richTextRelationshipPromise } from './data/richTextRelationshipPromise'
import { richTextValidate } from './data/validation'
import RichTextField from './field'

export function slateEditor(args: AdapterArguments): RichTextAdapter<AdapterArguments> {
  return {
    CellComponent: withMergedProps({
      Component: RichTextCell,
      toMergeIntoProps: args,
    }),
    FieldComponent: withMergedProps({
      Component: RichTextField,
      toMergeIntoProps: args,
    }),
    afterReadPromise({
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
