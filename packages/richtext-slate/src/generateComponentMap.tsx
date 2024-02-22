import type { RichTextAdapter } from 'payload/types'

import { initI18n } from '@payloadcms/translations'
import { translations } from '@payloadcms/translations/client'
import { mapFields } from '@payloadcms/ui/utilities'
import { sanitizeFields } from 'payload/config'
import React from 'react'

import type { AdapterArguments, RichTextCustomElement, RichTextCustomLeaf } from '.'

import elementTypes from './field/elements'
import { transformExtraFields } from './field/elements/link/utilities'
import leafTypes from './field/leaves'

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

            break
          }

          case 'upload':
            break

          case 'relationship':
            break
        }
      }
    })

    return componentMap
  }
