import type { RichTextAdapter } from 'payload/types'

import { withMergedProps } from '@payloadcms/ui/utilities'
import { withNullableJSONSchemaType } from 'payload/utilities'
import React from 'react'

import type { AdapterArguments, RichTextCustomLeaf } from './types'

import RichTextCell from './cell'
import { richTextRelationshipPromise } from './data/richTextRelationshipPromise'
import { richTextValidate } from './data/validation'
import RichTextField from './field'
import leafTypes from './field/leaves'

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
    generateComponentMap: () => {
      const componentMap = new Map()

      ;(args?.admin?.leaves || Object.values(leafTypes)).forEach((leaf) => {
        let leafObject: RichTextCustomLeaf

        if (typeof leaf === 'object' && leaf !== null) {
          leafObject = leaf
        } else if (typeof leaf === 'string' && leafTypes[leaf]) {
          leafObject = leafTypes[leaf]
        }

        if (leafObject) {
          const LeafButton = leafObject.Button
          const LeafComponent = leafObject.Leaf

          componentMap.set(`leaf.button.${leafObject.name}`, <LeafButton />)
          componentMap.set(`leaf.component.${leafObject.name}`, <LeafComponent />)
        }
      })

      return componentMap
    },
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
