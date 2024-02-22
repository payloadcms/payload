import type { RichTextAdapter } from 'payload/types'

import { initI18n } from '@payloadcms/translations'
import { translations } from '@payloadcms/translations/client'
import { sanitizeFields } from 'payload/config'

import type { AdapterArguments, RichTextCustomElement } from '.'

import elementTypes from './field/elements'
import { linkFieldsSchemaPath } from './field/elements/link/shared'
import { transformExtraFields } from './field/elements/link/utilities'

export const getGenerateSchemaMap =
  (args: AdapterArguments): RichTextAdapter['generateSchemaMap'] =>
  ({ config, schemaMap, schemaPath }) => {
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

            schemaMap.set(`${schemaPath}.${linkFieldsSchemaPath}`, linkFields)

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
  }
