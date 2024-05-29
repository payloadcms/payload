import type { Config } from 'payload/config'
import type { Block, BlockField, Field } from 'payload/types'

import { traverseFields } from '@payloadcms/next/utilities'
import { baseBlockFields, sanitizeFields } from 'payload/config'
import { fieldsToJSONSchema, formatLabels } from 'payload/utilities'

import type { FeatureProviderProviderServer } from '../types.js'
import type { BlocksFeatureClientProps } from './feature.client.js'

import { createNode } from '../typeUtilities.js'
import { BlocksFeatureClientComponent } from './feature.client.js'
import { i18n } from './i18n.js'
import { BlockNode } from './nodes/BlocksNode.js'
import { blockPopulationPromiseHOC } from './populationPromise.js'
import { blockValidationHOC } from './validate.js'

export type BlocksFeatureProps = {
  blocks: Block[]
}

export const BlocksFeature: FeatureProviderProviderServer<
  BlocksFeatureProps,
  BlocksFeatureClientProps
> = (props) => {
  return {
    feature: async ({ config: _config, isRoot }) => {
      if (props?.blocks?.length) {
        const validRelationships = _config.collections.map((c) => c.slug) || []

        for (const block of props.blocks) {
          block.fields = block.fields.concat(baseBlockFields)
          block.labels = !block.labels ? formatLabels(block.slug) : block.labels

          block.fields = await sanitizeFields({
            config: _config as unknown as Config,
            fields: block.fields,
            requireFieldLevelRichTextEditor: isRoot,
            validRelationships,
          })
        }
      }

      // Build clientProps
      const clientProps: BlocksFeatureClientProps = {
        reducedBlocks: [],
      }
      for (const block of props.blocks) {
        clientProps.reducedBlocks.push({
          slug: block.slug,
          fieldMap: [],
          imageAltText: block.imageAltText,
          imageURL: block.imageURL,
          labels: block.labels,
        })
      }

      return {
        ClientComponent: BlocksFeatureClientComponent,
        clientFeatureProps: clientProps,
        generateSchemaMap: ({ config, i18n, props }) => {
          const validRelationships = config.collections.map((c) => c.slug) || []

          /**
           * Add sub-fields to the schemaMap. E.g. if you have an array field as part of the block, and it runs addRow, it will request these
           * sub-fields from the component map. Thus, we need to put them in the component map here.
           */
          const schemaMap = new Map<string, Field[]>()

          for (const block of props.blocks) {
            schemaMap.set(block.slug, block.fields || [])

            traverseFields({
              config,
              fields: block.fields,
              i18n,
              schemaMap,
              schemaPath: block.slug,
              validRelationships,
            })
          }

          return schemaMap
        },
        generatedTypes: {
          modifyOutputSchema: ({
            collectionIDFieldTypes,
            config,
            currentSchema,
            field,
            interfaceNameDefinitions,
          }) => {
            if (!props?.blocks?.length) {
              return currentSchema
            }

            const blocksField: BlockField = {
              name: field?.name + '_lexical_blocks',
              type: 'blocks',
              blocks: props.blocks,
            }
            // This is only done so that interfaceNameDefinitions sets those block's interfaceNames.
            // we don't actually use the JSON Schema itself in the generated types yet.
            fieldsToJSONSchema(
              collectionIDFieldTypes,
              [blocksField],
              interfaceNameDefinitions,
              config,
            )

            return currentSchema
          },
        },
        i18n,
        nodes: [
          createNode({
            /* // TODO: Implement these hooks once docWithLocales / originalSiblingDoc => node matching has been figured out
            hooks: {
              beforeChange: [
                async ({ context, findMany, node, operation, overrideAccess, req }) => {
                  const blockType = node.fields.blockType

                  const block = deepCopyObject(
                    props.blocks.find((block) => block.slug === blockType),
                  )


                  await beforeChangeTraverseFields({
                    id: null,
                    collection: null,
                    context,
                    data: node.fields,
                    doc: node.fields,
                    fields: sanitizedBlock.fields,
                    global: null,
                    mergeLocaleActions: [],
                    operation:
                      operation === 'create' || operation === 'update' ? operation : 'update',
                    overrideAccess,
                    path: '',
                    req,
                    siblingData: node.fields,
                    siblingDoc: node.fields,
                  })


                  return node
                },
              ],
              beforeValidate: [
                async ({ context, findMany, node, operation, overrideAccess, req }) => {
                  const blockType = node.fields.blockType

                  const block = deepCopyObject(
                    props.blocks.find((block) => block.slug === blockType),
                  )



                  await beforeValidateTraverseFields({
                    id: null,
                    collection: null,
                    context,
                    data: node.fields,
                    doc: node.fields,
                    fields: sanitizedBlock.fields,
                    global: null,
                    operation:
                      operation === 'create' || operation === 'update' ? operation : 'update',
                    overrideAccess,
                    req,
                    siblingData: node.fields,
                    siblingDoc: node.fields,
                  })

                  return node
                },
              ],
            },*/
            node: BlockNode,
            populationPromises: [blockPopulationPromiseHOC(props)],
            validations: [blockValidationHOC(props)],
          }),
        ],
        serverFeatureProps: props,
      }
    },
    key: 'blocks',
    serverFeatureProps: props,
  }
}
