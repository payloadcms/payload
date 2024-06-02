import type { Config } from 'payload/config'
import type { Block, BlockField, Field } from 'payload/types'

import { traverseFields } from '@payloadcms/ui/utilities/buildFieldSchemaMap/traverseFields'
import { baseBlockFields, sanitizeFields } from 'payload/config'
import {
  afterChangeTraverseFields,
  afterReadTraverseFields,
  beforeChangeTraverseFields,
  beforeValidateTraverseFields,
  deepCopyObject,
  fieldsToJSONSchema,
  formatLabels,
} from 'payload/utilities'

import type { FeatureProviderProviderServer } from '../types.js'
import type { BlocksFeatureClientProps } from './feature.client.js'

import { createNode } from '../typeUtilities.js'
import { BlocksFeatureClientComponent } from './feature.client.js'
import { blockPopulationPromiseHOC } from './graphQLPopulationPromise.js'
import { i18n } from './i18n.js'
import { BlockNode } from './nodes/BlocksNode.js'
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
            graphQLPopulationPromises: [blockPopulationPromiseHOC(props)],
            hooks: {
              afterChange: [
                async ({
                  context,
                  node,
                  operation,
                  originalNode,
                  parentRichTextFieldPath,
                  parentRichTextFieldSchemaPath,
                  req,
                }) => {
                  const blockType = node.fields.blockType

                  const block = deepCopyObject(
                    props.blocks.find((block) => block.slug === blockType),
                  )

                  await afterChangeTraverseFields({
                    collection: null,
                    context,
                    data: node.fields,
                    doc: originalNode.fields,
                    fields: block.fields,
                    global: null,
                    operation:
                      operation === 'create' || operation === 'update' ? operation : 'update',
                    path: parentRichTextFieldPath,
                    previousDoc: originalNode.fields,
                    previousSiblingDoc: originalNode.fields,
                    req,
                    schemaPath: parentRichTextFieldSchemaPath,
                    siblingData: node.fields,
                    siblingDoc: originalNode.fields,
                  })

                  return node
                },
              ],
              afterRead: [
                ({
                  context,
                  currentDepth,
                  depth,
                  draft,
                  fallbackLocale,
                  fieldPromises,
                  findMany,
                  flattenLocales,
                  locale,
                  node,
                  overrideAccess,
                  parentRichTextFieldPath,
                  parentRichTextFieldSchemaPath,
                  populationPromises,
                  req,
                  showHiddenFields,
                  triggerAccessControl,
                  triggerHooks,
                }) => {
                  const blockType = node.fields.blockType

                  const block = deepCopyObject(
                    props.blocks.find((block) => block.slug === blockType),
                  )

                  afterReadTraverseFields({
                    collection: null,
                    context,
                    currentDepth,
                    depth,
                    doc: node.fields,
                    draft,
                    fallbackLocale,
                    fieldPromises,
                    fields: block.fields,
                    findMany,
                    flattenLocales,
                    global: null,
                    locale,
                    overrideAccess,
                    path: parentRichTextFieldPath,
                    populationPromises,
                    req,
                    schemaPath: parentRichTextFieldSchemaPath,
                    showHiddenFields,
                    siblingDoc: node.fields,
                    triggerAccessControl,
                    triggerHooks,
                  })
                  //await Promise.all(fieldPromises) // TODO: (not 100% sure on this, maybe we should create our own promise arrays and await them here). // END TODO. Do NOT await fieldPromises here. They will be added to the fieldPromises array of the document containing this richText field, and awaited there, on the document-level.

                  return node
                },
              ],
              beforeChange: [
                async ({
                  context,
                  duplicate,
                  errors,
                  mergeLocaleActions,
                  node,
                  operation,
                  originalNode,
                  originalNodeWithLocales,
                  parentRichTextFieldPath,
                  parentRichTextFieldSchemaPath,
                  req,
                  skipValidation,
                }) => {
                  const blockType = node.fields.blockType

                  const block = deepCopyObject(
                    props.blocks.find((block) => block.slug === blockType),
                  )

                  await beforeChangeTraverseFields({
                    id: null,
                    collection: null,
                    context,
                    data: node.fields,
                    doc: originalNode.fields,
                    docWithLocales: originalNodeWithLocales?.fields ?? {},
                    duplicate,
                    errors,
                    fields: block.fields,
                    global: null,
                    mergeLocaleActions,
                    operation:
                      operation === 'create' || operation === 'update' ? operation : 'update',
                    path: parentRichTextFieldPath,
                    req,
                    schemaPath: parentRichTextFieldSchemaPath,
                    siblingData: node.fields,
                    siblingDoc: originalNode.fields,
                    siblingDocWithLocales: originalNodeWithLocales?.fields ?? {},
                    skipValidation,
                  })

                  return node
                },
              ],

              beforeValidate: [
                async ({ context, node, operation, originalNode, overrideAccess, req }) => {
                  const blockType = node.fields.blockType

                  const block = deepCopyObject(
                    props.blocks.find((block) => block.slug === blockType),
                  )

                  await beforeValidateTraverseFields({
                    id: null,
                    collection: null,
                    context,
                    data: node.fields,
                    doc: originalNode.fields,
                    fields: block.fields,
                    global: null,
                    operation:
                      operation === 'create' || operation === 'update' ? operation : 'update',
                    overrideAccess,
                    path: [],
                    req,
                    schemaPath: [],
                    siblingData: node.fields,
                    siblingDoc: originalNode.fields,
                  })

                  return node
                },
              ],
            },
            node: BlockNode,
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
