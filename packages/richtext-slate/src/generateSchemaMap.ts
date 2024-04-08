import type { RichTextAdapter } from 'payload/types'

import { initI18n } from '@payloadcms/translations'
import { sanitizeFields } from 'payload/config'

import type { AdapterArguments, RichTextCustomElement } from './types.js'

import { elements as elementTypes } from './field/elements/index.js'
import { linkFieldsSchemaPath } from './field/elements/link/shared.js'
import { transformExtraFields } from './field/elements/link/utilities.js'
import { uploadFieldsSchemaPath } from './field/elements/upload/shared.js'

export const getGenerateSchemaMap =
  (args: AdapterArguments): RichTextAdapter['generateSchemaMap'] =>
  ({ config, schemaMap, schemaPath }) => {
    const i18n = initI18n({ config: config.i18n, context: 'client' })
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
              config,
              fields: transformExtraFields(args.admin?.link?.fields, config, i18n),
              validRelationships,
            })

            schemaMap.set(`${schemaPath}.${linkFieldsSchemaPath}`, linkFields)

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
                const uploadFields = sanitizeFields({
                  config,
                  fields: args?.admin?.upload?.collections[collection.slug]?.fields,
                  validRelationships,
                })

                schemaMap.set(
                  `${schemaPath}.${uploadFieldsSchemaPath}.${collection.slug}`,
                  uploadFields,
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
