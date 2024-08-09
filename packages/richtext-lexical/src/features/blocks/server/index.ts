import type { Block, BlockField, Config, Field } from 'payload'

import { fieldsToJSONSchema, sanitizeFields } from 'payload'

import type { BlocksFeatureClientProps } from '../client/index.js'

import { createServerFeature } from '../../../utilities/createServerFeature.js'
import { createNode } from '../../typeUtilities.js'
import { blockPopulationPromiseHOC } from './graphQLPopulationPromise.js'
import { i18n } from './i18n.js'
import { ServerBlockNode } from './nodes/BlocksNode.js'
import { ServerInlineBlockNode } from './nodes/InlineBlocksNode.js'
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
    // Build clientProps
    const clientProps: BlocksFeatureClientProps = {
      clientBlockSlugs: [],
      clientInlineBlockSlugs: [],
    }
    const validRelationships = _config.collections.map((c) => c.slug) || []

    const sanitized = await sanitizeFields({
      config: _config as unknown as Config,
      fields: [
        {
          name: 'lexical_blocks',
          type: 'blocks',
          blocks: props.blocks ?? [],
        },
        {
          name: 'lexical_inline_blocks',
          type: 'blocks',
          blocks: props.inlineBlocks ?? [],
        },
      ],
      requireFieldLevelRichTextEditor: isRoot,
      validRelationships,
    })

    props.blocks = (sanitized[0] as BlockField).blocks
    props.inlineBlocks = (sanitized[1] as BlockField).blocks

    clientProps.clientBlockSlugs = props.blocks.map((block) => block.slug)
    clientProps.clientInlineBlockSlugs = props.inlineBlocks.map((block) => block.slug)

    return {
      ClientFeature: '@payloadcms/richtext-lexical/client#BlocksFeatureClient',
      clientFeatureProps: clientProps,
      generateSchemaMap: ({ props }) => {
        /**
         * Add sub-fields to the schemaMap. E.g. if you have an array field as part of the block, and it runs addRow, it will request these
         * sub-fields from the component map. Thus, we need to put them in the component map here.
         */
        const schemaMap = new Map<string, Field[]>()

        if (props?.blocks?.length) {
          schemaMap.set('lexical_blocks', [
            {
              name: 'lexical_blocks',
              type: 'blocks',
              blocks: props.blocks,
            },
          ])
        }

        if (props?.inlineBlocks?.length) {
          // To generate block schemaMap which generates things like the componentMap for admin.Label
          schemaMap.set('lexical_inline_blocks', [
            {
              name: 'lexical_inline_blocks',
              type: 'blocks',
              blocks: props.inlineBlocks,
            },
          ])
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
            if (!node) {
              if (props?.blocks?.length) {
                return [
                  {
                    name: 'lexical_blocks',
                    type: 'blocks',
                    blocks: props.blocks,
                  },
                ]
              }
              return []
            }

            const blockType = node.fields.blockType

            const block = props.blocks.find((block) => block.slug === blockType)
            return block?.fields
          },
          getSubFieldsData: ({ node }) => {
            return node?.fields
          },
          graphQLPopulationPromises: [blockPopulationPromiseHOC(props.blocks)],
          node: ServerBlockNode,
          validations: [blockValidationHOC(props.blocks)],
        }),
        createNode({
          getSubFields: ({ node }) => {
            if (!node) {
              if (props?.inlineBlocks?.length) {
                return [
                  {
                    name: 'lexical_inline_blocks',
                    type: 'blocks',
                    blocks: props.inlineBlocks,
                  },
                ]
              }
              return []
            }

            const blockType = node.fields.blockType

            const block = props.inlineBlocks.find((block) => block.slug === blockType)
            return block?.fields
          },
          getSubFieldsData: ({ node }) => {
            return node?.fields
          },
          graphQLPopulationPromises: [blockPopulationPromiseHOC(props.inlineBlocks)],
          node: ServerInlineBlockNode,
          validations: [blockValidationHOC(props.inlineBlocks)],
        }),
      ],
      sanitizedServerFeatureProps: props,
    }
  },
  key: 'blocks',
})
