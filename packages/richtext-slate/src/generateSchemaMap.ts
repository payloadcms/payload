import type { Field, RichTextAdapter } from 'payload'

import type { AdapterArguments, RichTextCustomElement } from './types.js'

import { elements as elementTypes } from './field/elements/index.js'
import { linkFieldsSchemaPath } from './field/elements/link/shared.js'
import { uploadFieldsSchemaPath } from './field/elements/upload/shared.js'

export const getGenerateSchemaMap =
  (args: AdapterArguments): RichTextAdapter['generateSchemaMap'] =>
  ({ config, schemaMap, schemaPath }) => {
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
            schemaMap.set(
              `${schemaPath}.${linkFieldsSchemaPath}`,
              args.admin?.link?.fields as Field[],
            )

            break
          }

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
                schemaMap.set(
                  `${schemaPath}.${uploadFieldsSchemaPath}.${collection.slug}`,
                  args?.admin?.upload?.collections[collection.slug]?.fields,
                )
              }
            })

            break
          }

          case 'relationship':
            break
        }
      }
    })

    return schemaMap
  }
