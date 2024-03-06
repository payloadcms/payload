import type { RichTextAdapter } from 'payload/types'

import { withNullableJSONSchemaType } from 'payload/utilities'

import type { AdapterArguments } from './types.d.ts'

import RichTextCell from './cell/index.js'
import { richTextRelationshipPromise } from './data/richTextRelationshipPromise.js'
import { richTextValidate } from './data/validation.js'
import RichTextField from './field/index.js'
import { getGenerateComponentMap } from './generateComponentMap.js'
import { getGenerateSchemaMap } from './generateSchemaMap.js'

export function slateEditor(args: AdapterArguments): RichTextAdapter<any[], AdapterArguments, any> {
  return {
    CellComponent: RichTextCell,
    FieldComponent: RichTextField,
    generateComponentMap: getGenerateComponentMap(args),
    generateSchemaMap: getGenerateSchemaMap(args),
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

export { default as ElementButton } from './field/elements/Button.js'

export { default as toggleElement } from './field/elements/toggle.js'
export { default as LeafButton } from './field/leaves/Button.js'
export type {
  AdapterArguments,
  ElementNode,
  FieldProps,
  RichTextCustomElement,
  RichTextCustomLeaf,
  RichTextElement,
  RichTextLeaf,
  TextNode,
} from './types.d.ts'

export { nodeIsTextNode } from './types.js'
