import type { Field, RichTextAdapter } from 'payload'

import { traverseFields } from '@payloadcms/ui/utilities/buildFieldSchemaMap/traverseFields'

import type { AdapterArguments, RichTextCustomElement } from './types.js'

import { elements as elementTypes } from './field/elements/index.js'
import { linkFieldsSchemaPath } from './field/elements/link/shared.js'
import { uploadFieldsSchemaPath } from './field/elements/upload/shared.js'

export const getGenerateSchemaMap =
  (args: AdapterArguments): RichTextAdapter['generateSchemaMap'] =>
  ({ config, i18n, schemaMap, schemaPath }) => {
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
            if (args.admin?.link?.fields) {
              schemaMap.set(`${schemaPath}.${linkFieldsSchemaPath}`, {
                fields: args.admin?.link?.fields as Field[],
              })

              // generate schema map entries for sub-fields using traverseFields
              traverseFields({
                config,
                fields: args.admin?.link?.fields as Field[],
                i18n,
                parentIndexPath: '',
                parentSchemaPath: `${schemaPath}.${linkFieldsSchemaPath}`,
                schemaMap,
              })
            }

            break
          }

          case 'relationship':
            break

          case 'upload': {
            const uploadEnabledCollections = config.collections.filter(
              ({ admin: { enableRichTextRelationship, hidden }, upload }) => {
                if (hidden === true) {
                  return false
                }

                return enableRichTextRelationship && Boolean(upload) === true
              },
            )

            uploadEnabledCollections.forEach((collection) => {
              if (args?.admin?.upload?.collections[collection.slug]?.fields) {
                schemaMap.set(`${schemaPath}.${uploadFieldsSchemaPath}.${collection.slug}`, {
                  fields: args?.admin?.upload?.collections[collection.slug]?.fields,
                })

                // generate schema map entries for sub-fields using traverseFields
                traverseFields({
                  config,
                  fields: args?.admin?.upload?.collections[collection.slug]?.fields,
                  i18n,
                  parentIndexPath: '',
                  parentSchemaPath: `${schemaPath}.${uploadFieldsSchemaPath}.${collection.slug}`,
                  schemaMap,
                })
              }
            })

            break
          }
        }
      }
    })

    return schemaMap
  }
