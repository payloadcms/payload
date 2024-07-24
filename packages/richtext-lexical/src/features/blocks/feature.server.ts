import type { Block, BlockField, Config, Field } from 'payload'

import { baseBlockFields, fieldsToJSONSchema, formatLabels, sanitizeFields } from 'payload'

import type { BlocksFeatureClientProps } from './feature.client.js'

// eslint-disable-next-line payload/no-imports-from-exports-dir
import { BlocksFeatureClient } from '../../exports/client/index.js'
import { createServerFeature } from '../../utilities/createServerFeature.js'
import { createNode } from '../typeUtilities.js'
import { blockPopulationPromiseHOC } from './graphQLPopulationPromise.js'
import { i18n } from './i18n.js'
import { BlockNode } from './nodes/BlocksNode.js'
import { InlineBlockNode } from './nodes/InlineBlocksNode.js'
import { blockValidationHOC } from './validate.js'

export type BlocksFeatureProps = {
  blocks?: Block[]
  inlineBlocks?: Block[]
}

export const BlocksFeature = createServerFeature<
  BlocksFeatureProps,
  BlocksFeatureProps,
  BlocksFeatureClientProps
>({
  feature: async ({ config: _config, isRoot, props }) => {
    if (props?.blocks?.length || props?.inlineBlocks?.length) {
      const validRelationships = _config.collections.map((c) => c.slug) || []

      if (props?.blocks?.length) {
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
      if (props?.inlineBlocks?.length) {
        for (const block of props.inlineBlocks) {
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
    }

    // Build clientProps
    const clientProps: BlocksFeatureClientProps = {
      reducedBlocks: [],
      reducedInlineBlocks: [],
    }
    if (props?.blocks?.length) {
      for (const block of props.blocks) {
        clientProps.reducedBlocks.push({
          slug: block.slug,
          LabelComponent: block?.admin?.components?.Label,
          fieldMap: [],
          imageAltText: block.imageAltText,
          imageURL: block.imageURL,
          labels: block.labels,
        })
      }
    }
    if (props?.inlineBlocks?.length) {
      for (const block of props.inlineBlocks) {
        clientProps.reducedInlineBlocks.push({
          slug: block.slug,
          LabelComponent: block?.admin?.components?.Label,
          fieldMap: [],
          imageAltText: block.imageAltText,
          imageURL: block.imageURL,
          labels: block.labels,
        })
      }
    }

    return {
      ClientFeature: BlocksFeatureClient,
      clientFeatureProps: clientProps,
      generateSchemaMap: ({ props }) => {
        /**
         * Add sub-fields to the schemaMap. E.g. if you have an array field as part of the block, and it runs addRow, it will request these
         * sub-fields from the component map. Thus, we need to put them in the component map here.
         */
        const schemaMap = new Map<string, Field[]>()

        if (props?.blocks?.length) {
          for (const block of props.blocks) {
            schemaMap.set(block.slug, block.fields || [])
          }
        }

        if (props?.inlineBlocks?.length) {
          for (const block of props.inlineBlocks) {
            schemaMap.set(block.slug, block.fields || [])
          }
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
          if (!props?.blocks?.length && !props?.inlineBlocks?.length) {
            return currentSchema
          }

          const fields: BlockField[] = []

          if (props?.blocks?.length) {
            fields.push({
              name: field?.name + '_lexical_blocks',
              type: 'blocks',
              blocks: props.blocks,
            })
          }
          if (props?.inlineBlocks?.length) {
            fields.push({
              name: field?.name + '_lexical_inline_blocks',
              type: 'blocks',
              blocks: props.inlineBlocks,
            })
          }

          if (fields.length) {
            // This is only done so that interfaceNameDefinitions sets those block's interfaceNames.
            // we don't actually use the JSON Schema itself in the generated types yet.
            fieldsToJSONSchema(collectionIDFieldTypes, fields, interfaceNameDefinitions, config)
          }

          return currentSchema
        },
      },
      i18n,
      nodes: [
        createNode({
          getSubFields: ({ node }) => {
            const blockType = node.fields.blockType

            const block = props.blocks.find((block) => block.slug === blockType)
            return block?.fields
          },
          getSubFieldsData: ({ node }) => {
            return node?.fields
          },
          graphQLPopulationPromises: [blockPopulationPromiseHOC(props.blocks)],
          node: BlockNode,
          validations: [blockValidationHOC(props.blocks)],
        }),
        createNode({
          getSubFields: ({ node }) => {
            const blockType = node.fields.blockType

            const block = props.inlineBlocks.find((block) => block.slug === blockType)
            return block?.fields
          },
          getSubFieldsData: ({ node }) => {
            return node?.fields
          },
          graphQLPopulationPromises: [blockPopulationPromiseHOC(props.inlineBlocks)],
          node: InlineBlockNode,
          validations: [blockValidationHOC(props.inlineBlocks)],
        }),
      ],
      sanitizedServerFeatureProps: props,
    }
  },
  key: 'blocks',
})
