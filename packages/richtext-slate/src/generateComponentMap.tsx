import type { RichTextAdapter } from 'payload/types'

import { initI18n } from '@payloadcms/translations'
import { translations } from '@payloadcms/translations/client'
import { mapFields } from '@payloadcms/ui/utilities'
import { sanitizeFields } from 'payload/config'
import React from 'react'

import type { AdapterArguments, RichTextCustomElement, RichTextCustomLeaf } from './types.js'

import { elements as elementTypes } from './field/elements/index.js'
import { linkFieldsSchemaPath } from './field/elements/link/shared.js'
import { transformExtraFields } from './field/elements/link/utilities.js'
import { uploadFieldsSchemaPath } from './field/elements/upload/shared.js'
import { defaultLeaves as leafTypes } from './field/leaves/index.js'

export const getGenerateComponentMap =
  (args: AdapterArguments): RichTextAdapter['generateComponentMap'] =>
  ({ config }) => {
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

        if (Array.isArray(leafObject.plugins)) {
          leafObject.plugins.forEach((Plugin, i) => {
            componentMap.set(`leaf.plugin.${leafObject.name}.${i}`, <Plugin />)
          })
        }
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

        if (Array.isArray(element.plugins)) {
          element.plugins.forEach((Plugin, i) => {
            componentMap.set(`element.plugin.${element.name}.${i}`, <Plugin />)
          })
        }

        switch (element.name) {
          case 'link': {
            const linkFields = sanitizeFields({
              config,
              fields: transformExtraFields(args.admin?.link?.fields, config, i18n),
              validRelationships,
            })

            const mappedFields = mapFields({
              config,
              fieldSchema: linkFields,
              readOnly: false,
            })

            componentMap.set(linkFieldsSchemaPath, mappedFields)

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

                const mappedFields = mapFields({
                  config,
                  fieldSchema: uploadFields,
                  readOnly: false,
                })

                componentMap.set(`${uploadFieldsSchemaPath}.${collection.slug}`, mappedFields)
              }
            })

            break
          }

          case 'relationship':
            break
        }
      }
    })

    return componentMap
  }
