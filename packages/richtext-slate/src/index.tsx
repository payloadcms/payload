import type { RichTextAdapter } from 'payload/types'

import { withNullableJSONSchemaType } from 'payload/utilities'

import type { AdapterArguments } from './types.js'

import { RichTextCell } from './cell/index.js'
import { richTextRelationshipPromise } from './data/richTextRelationshipPromise.js'
import { richTextValidate } from './data/validation.js'
import { RichTextField } from './field/index.js'
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
    populationPromises({
      context,
      currentDepth,
      depth,
      field,
      fieldPromises,
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
        richTextRelationshipPromise({
          context,
          currentDepth,
          depth,
          field,
          fieldPromises,
          findMany,
          flattenLocales,
          overrideAccess,
          populationPromises,
          req,
          showHiddenFields,
          siblingDoc,
        })
      }
    },
    validate: richTextValidate,
  }
}

export { ElementButton } from './field/elements/Button.js'

export { toggleElement } from './field/elements/toggle.js'
export { LeafButton } from './field/leaves/Button.js'
export type {
  AdapterArguments,
  ElementNode,
  FieldProps,
  RichTextCustomElement,
  RichTextCustomLeaf,
  RichTextElement,
  RichTextLeaf,
  TextNode,
} from './types.js'

export { nodeIsTextNode } from './types.js'
