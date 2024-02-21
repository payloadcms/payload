import type { Field, RichTextAdapter } from 'payload/types'

import { initI18n } from '@payloadcms/translations'
import { translations } from '@payloadcms/translations/client'
import { mapFields, withMergedProps } from '@payloadcms/ui/utilities'
import { sanitizeFields } from 'payload/config'
import { withNullableJSONSchemaType } from 'payload/utilities'
import React from 'react'

import type { AdapterArguments, RichTextCustomElement, RichTextCustomLeaf } from './types'

import RichTextCell from './cell'
import { richTextRelationshipPromise } from './data/richTextRelationshipPromise'
import { richTextValidate } from './data/validation'
import RichTextField from './field'
import elementTypes from './field/elements'
import { transformExtraFields } from './field/elements/link/utilities'
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
    generateComponentMap: ({ config }) => {
      const componentMap = new Map()

      const i18n = initI18n({ config: config.i18n, context: 'client', translations })
      const validRelationships = config.collections.map((c) => c.slug) || []

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
      ;(args?.admin?.elements || Object.values(elementTypes)).forEach((el) => {
        let element: RichTextCustomElement

        if (typeof el === 'object' && el !== null) {
          element = el
        } else if (typeof el === 'string' && elementTypes[el]) {
          element = elementTypes[el]
        }

        if (element) {
          const ElementButton = element.Button
          const ElementComponent = element.Element

          if (ElementButton) componentMap.set(`element.button.${element.name}`, <ElementButton />)
          componentMap.set(`element.component.${element.name}`, <ElementComponent />)

          switch (element.name) {
            case 'link': {
              const linkFields = sanitizeFields({
                config: config,
                fields: transformExtraFields(args.admin?.link?.fields, config, i18n),
                validRelationships,
              })

              const mappedFields = mapFields({
                config,
                fieldSchema: linkFields,
                operation: 'update',
                permissions: {},
                readOnly: false,
              })

              componentMap.set('link.fields', mappedFields)

              return
            }

            case 'upload':
              break

            case 'relationship':
              break
          }
        }
      })

      return componentMap
    },
    generateSchemaMap: ({ config, schemaMap, schemaPath }) => {
      const i18n = initI18n({ config: config.i18n, context: 'client', translations })
      const validRelationships = config.collections.map((c) => c.slug) || []

      ;(args?.admin?.elements || Object.values(elementTypes)).forEach((el) => {
        let element: RichTextCustomElement

        if (typeof el === 'object' && el !== null) {
          element = el
        } else if (typeof el === 'string' && elementTypes[el]) {
          element = elementTypes[el]
        }

        if (element) {
          switch (element.name) {
            case 'link': {
              const linkFields = sanitizeFields({
                config: config,
                fields: transformExtraFields(args.admin?.link?.fields, config, i18n),
                validRelationships,
              })

              schemaMap.set(`${schemaPath}.link`, linkFields)

              return
            }

            case 'upload':
              break

            case 'relationship':
              break
          }
        }
      })

      return schemaMap
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
