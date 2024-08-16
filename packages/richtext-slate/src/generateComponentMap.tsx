import type { ClientField, Field, MappedComponent, RichTextGenerateComponentMap } from 'payload'

import { createClientFields } from '@payloadcms/ui/utilities/createClientConfig'
import { deepCopyObjectSimple } from 'payload'

import type { AdapterArguments, RichTextCustomElement, RichTextCustomLeaf } from './types.js'

import { elements as elementTypes } from './field/elements/index.js'
import { linkFieldsSchemaPath } from './field/elements/link/shared.js'
import { uploadFieldsSchemaPath } from './field/elements/upload/shared.js'
import { defaultLeaves as leafTypes } from './field/leaves/index.js'

export const getGenerateComponentMap =
  (args: AdapterArguments): RichTextGenerateComponentMap =>
  ({ createMappedComponent, i18n, importMap, payload }) => {
    const componentMap: Map<string, ClientField[] | MappedComponent> = new Map()

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

        componentMap.set(
          `leaf.button.${leafObject.name}`,
          createMappedComponent(LeafButton, undefined, undefined, 'slate-LeafButton'),
        )

        componentMap.set(
          `leaf.component.${leafObject.name}`,
          createMappedComponent(LeafComponent, undefined, undefined, 'slate-LeafComponent'),
        )

        if (Array.isArray(leafObject.plugins)) {
          leafObject.plugins.forEach((Plugin, i) => {
            componentMap.set(
              `leaf.plugin.${leafObject.name}.${i}`,
              createMappedComponent(Plugin, undefined, undefined, 'slate-LeafPlugin'),
            )
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

        if (ElementButton)
          componentMap.set(
            `element.button.${element.name}`,
            createMappedComponent(ElementButton, undefined, undefined, 'slate-ElementButton'),
          )
        componentMap.set(
          `element.component.${element.name}`,
          createMappedComponent(ElementComponent, undefined, undefined, 'slate-ElementComponent'),
        )

        if (Array.isArray(element.plugins)) {
          element.plugins.forEach((Plugin, i) => {
            componentMap.set(
              `element.plugin.${element.name}.${i}`,
              createMappedComponent(Plugin, undefined, undefined, 'slate-ElementPlugin'),
            )
          })
        }

        switch (element.name) {
          case 'link': {
            let clientFields = deepCopyObjectSimple(
              args.admin?.link?.fields,
            ) as unknown as ClientField[]
            clientFields = createClientFields({
              clientFields,
              createMappedComponent,
              fields: args.admin?.link?.fields as Field[],
              i18n,
              importMap,
              payload,
            })

            componentMap.set(linkFieldsSchemaPath, clientFields)

            break
          }

          case 'upload': {
            const uploadEnabledCollections = payload.config.collections.filter(
              ({ admin: { enableRichTextRelationship, hidden }, upload }) => {
                if (hidden === true) {
                  return false
                }

                return enableRichTextRelationship && Boolean(upload) === true
              },
            )

            uploadEnabledCollections.forEach((collection) => {
              if (args?.admin?.upload?.collections[collection.slug]?.fields) {
                let clientFields = deepCopyObjectSimple(
                  args?.admin?.upload?.collections[collection.slug]?.fields,
                ) as unknown as ClientField[]
                clientFields = createClientFields({
                  clientFields,
                  createMappedComponent,
                  fields: args?.admin?.upload?.collections[collection.slug]?.fields,
                  i18n,
                  importMap,
                  payload,
                })

                componentMap.set(`${uploadFieldsSchemaPath}.${collection.slug}`, clientFields)
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
