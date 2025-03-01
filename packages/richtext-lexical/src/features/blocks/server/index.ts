import type {
  Block,
  BlocksField,
  BlockSlug,
  Config,
  FieldSchemaMap,
  FlattenedBlocksField,
  PayloadComponent,
} from 'payload'

import { fieldsToJSONSchema, flattenAllFields, sanitizeFields } from 'payload'

import { createServerFeature } from '../../../utilities/createServerFeature.js'
import { createNode } from '../../typeUtilities.js'
import { type DOMMap, getWrapperBlockNode } from '../WrapperBlockNode.js'
import { blockPopulationPromiseHOC } from './graphQLPopulationPromise.js'
import { i18n } from './i18n.js'
import { getBlockMarkdownTransformers } from './markdownTransformer.js'
import { ServerBlockNode } from './nodes/BlockNode.js'
import { ServerInlineBlockNode } from './nodes/InlineBlockNode.js'
import { blockValidationHOC } from './validate.js'

export type BlocksFeatureProps = {
  blocks?: (Block | BlockSlug)[] | Block[]
  inlineBlocks?: (Block | BlockSlug)[] | Block[]
  wrapperBlocks?: Array<{
    block: Block | BlockSlug
    createDOM: PayloadComponent
  }>
}

export const BlocksFeature = createServerFeature<BlocksFeatureProps, BlocksFeatureProps>({
  feature: async ({ config: _config, isRoot, parentIsLocalized, props: _props }) => {
    const validRelationships = _config.collections.map((c) => c.slug) || []

    const sanitized = await sanitizeFields({
      config: _config as unknown as Config,
      fields: [
        {
          name: 'lexical_blocks',
          type: 'blocks',
          blockReferences: _props.blocks ?? [],
          blocks: [],
        },
        {
          name: 'lexical_inline_blocks',
          type: 'blocks',
          blockReferences: _props.inlineBlocks ?? [],
          blocks: [],
        },
        {
          name: 'lexical_wrapper_blocks',
          type: 'blocks',
          blockReferences: _props.wrapperBlocks
            ? _props.wrapperBlocks.map((wrapperBlock) => wrapperBlock.block)
            : [],
          blocks: [],
        },
      ],
      parentIsLocalized,
      requireFieldLevelRichTextEditor: isRoot,
      validRelationships,
    })

    const blockConfigs: Block[] = []
    for (const _block of (sanitized[0] as BlocksField).blockReferences ??
      (sanitized[0] as BlocksField).blocks) {
      const block =
        typeof _block === 'string' ? _config?.blocks?.find((b) => b.slug === _block) : _block
      if (!block) {
        throw new Error(
          `Block not found for slug: ${typeof _block === 'string' ? _block : _block?.slug}`,
        )
      }
      blockConfigs.push(block)
    }

    const inlineBlockConfigs: Block[] = []
    for (const _block of (sanitized[1] as BlocksField).blockReferences ??
      (sanitized[1] as BlocksField).blocks) {
      const block =
        typeof _block === 'string' ? _config?.blocks?.find((b) => b.slug === _block) : _block
      if (!block) {
        throw new Error(
          `Block not found for slug: ${typeof _block === 'string' ? _block : _block?.slug}`,
        )
      }
      inlineBlockConfigs.push(block)
    }

    const domMap: DOMMap = {}

    const wrappedBlockSlugsAndCreateDOMs: {
      [blockSlug: string]: PayloadComponent
    } = {}

    const wrapperBlockConfigs: Block[] = []
    for (const wrapperBlock of _props.wrapperBlocks ?? []) {
      const block =
        typeof wrapperBlock.block === 'string'
          ? _config?.blocks?.find((b) => b.slug === wrapperBlock.block)
          : wrapperBlock.block
      if (!block) {
        throw new Error(
          `Block not found for slug: ${typeof wrapperBlock.block === 'string' ? wrapperBlock.block : wrapperBlock.block?.slug}`,
        )
      }
      wrapperBlockConfigs.push(block)

      wrappedBlockSlugsAndCreateDOMs[block.slug] = wrapperBlock.createDOM
    }

    return {
      ClientFeature: '@payloadcms/richtext-lexical/client#BlocksFeatureClient',
      componentImports: wrappedBlockSlugsAndCreateDOMs,
      generatedTypes: {
        modifyOutputSchema: ({
          collectionIDFieldTypes,
          config,
          currentSchema,
          field,
          i18n,
          interfaceNameDefinitions,
        }) => {
          if (!blockConfigs?.length && !inlineBlockConfigs?.length) {
            return currentSchema
          }

          const fields: FlattenedBlocksField[] = []

          if (blockConfigs?.length) {
            fields.push({
              name: field?.name + '_lexical_blocks',
              type: 'blocks',
              blocks: blockConfigs.map((block) => {
                return {
                  ...block,
                  flattenedFields: flattenAllFields({ fields: block.fields }),
                }
              }),
            })
          }
          if (inlineBlockConfigs?.length) {
            fields.push({
              name: field?.name + '_lexical_inline_blocks',
              type: 'blocks',
              blocks: inlineBlockConfigs.map((block) => {
                return {
                  ...block,
                  flattenedFields: flattenAllFields({ fields: block.fields }),
                }
              }),
            })
          }

          if (wrapperBlockConfigs?.length) {
            fields.push({
              name: field?.name + '_lexical_wrapper_blocks',
              type: 'blocks',
              blocks: wrapperBlockConfigs.map((wrapperBlock) => ({
                ...wrapperBlock,
                flattenedFields: flattenAllFields({ fields: wrapperBlock.fields }),
              })),
            })
          }

          if (fields.length) {
            // This is only done so that interfaceNameDefinitions sets those block's interfaceNames.
            // we don't actually use the JSON Schema itself in the generated types yet.
            fieldsToJSONSchema(
              collectionIDFieldTypes,
              fields,
              interfaceNameDefinitions,
              config,
              i18n,
            )
          }

          return currentSchema
        },
      },
      generateSchemaMap: ({ config }) => {
        /**
         * Add sub-fields to the schemaMap. E.g. if you have an array field as part of the block, and it runs addRow, it will request these
         * sub-fields from the component map. Thus, we need to put them in the component map here.
         */
        const schemaMap: FieldSchemaMap = new Map()

        if (blockConfigs?.length) {
          for (const block of blockConfigs) {
            const blockFields = [...block.fields]

            if (block?.admin?.components) {
              blockFields.unshift({
                name: `_components`,
                type: 'ui',
                admin: {
                  components: {
                    Block: block.admin?.components?.Block,
                    BlockLabel: block.admin?.components?.Label,
                  },
                },
              })
            }
            schemaMap.set(`lexical_blocks.${block.slug}.fields`, {
              fields: blockFields,
            })
            schemaMap.set(`lexical_blocks.${block.slug}`, {
              name: `lexical_blocks_${block.slug}`,
              type: 'blocks',
              blocks: [block],
            })
          }
        }

        if (inlineBlockConfigs?.length) {
          // To generate block schemaMap which generates things like the componentMap for admin.Label
          for (const block of inlineBlockConfigs) {
            const blockFields = [...block.fields]

            if (block?.admin?.components) {
              blockFields.unshift({
                name: `_components`,
                type: 'ui',
                admin: {
                  components: {
                    Block: block.admin?.components?.Block,
                    BlockLabel: block.admin?.components?.Label,
                  },
                },
              })
            }

            schemaMap.set(`lexical_inline_blocks.${block.slug}.fields`, {
              fields: blockFields,
            })

            schemaMap.set(`lexical_inline_blocks.${block.slug}`, {
              name: `lexical_inline_blocks_${block.slug}`,
              type: 'blocks',
              blocks: [block],
            })
          }
        }

        if (wrapperBlockConfigs?.length) {
          for (const block of wrapperBlockConfigs) {
            const blockFields = [...block.fields]

            if (block?.admin?.components) {
              blockFields.unshift({
                name: `_components`,
                type: 'ui',
                admin: {
                  components: {
                    Block: block.admin?.components?.Block,
                    BlockLabel: block.admin?.components?.Label,
                  },
                },
              })
            }
            schemaMap.set(`lexical_wrapper_blocks.${block.slug}.fields`, {
              fields: blockFields,
            })
            schemaMap.set(`lexical_wrapper_blocks.${block.slug}`, {
              name: `lexical_wrapper_blocks_${block.slug}`,
              type: 'blocks',
              blocks: [block],
            })
          }
        }

        return schemaMap
      },
      i18n,
      markdownTransformers: getBlockMarkdownTransformers({
        blocks: blockConfigs,
        inlineBlocks: inlineBlockConfigs,
      }),

      nodes: [
        createNode({
          // @ts-expect-error - TODO: fix this
          getSubFields: ({ node }) => {
            if (!node) {
              if (blockConfigs?.length) {
                return [
                  {
                    name: 'lexical_blocks',
                    type: 'blocks',
                    blocks: blockConfigs,
                  },
                ]
              }
              return []
            }

            const blockType = node.fields.blockType

            const block = blockConfigs?.find((block) => block.slug === blockType)
            return block?.fields
          },
          getSubFieldsData: ({ node }) => {
            return node?.fields
          },
          graphQLPopulationPromises: [blockPopulationPromiseHOC(blockConfigs)],
          node: ServerBlockNode,
          validations: [blockValidationHOC(blockConfigs)],
        }),
        createNode({
          // @ts-expect-error - TODO: fix this
          getSubFields: ({ node }) => {
            if (!node) {
              if (inlineBlockConfigs?.length) {
                return [
                  {
                    name: 'lexical_inline_blocks',
                    type: 'blocks',
                    blocks: inlineBlockConfigs,
                  },
                ]
              }
              return []
            }

            const blockType = node.fields.blockType

            const block = inlineBlockConfigs?.find((block) => block.slug === blockType)
            return block?.fields
          },
          getSubFieldsData: ({ node }) => {
            return node?.fields
          },
          graphQLPopulationPromises: [blockPopulationPromiseHOC(inlineBlockConfigs)],
          node: ServerInlineBlockNode,
          validations: [blockValidationHOC(inlineBlockConfigs)],
        }),
        createNode({
          // @ts-expect-error - TODO: fix this
          getSubFields: ({ node }) => {
            if (!node) {
              if (wrapperBlockConfigs?.length) {
                return [
                  {
                    name: 'lexical_wrapper_blocks',
                    type: 'blocks',
                    blocks: wrapperBlockConfigs,
                  },
                ]
              }
              return []
            }

            const blockType = node.fields.blockType

            const block = wrapperBlockConfigs?.find(
              (wrapperBlock) => wrapperBlock.slug === blockType,
            )
            return block?.fields
          },
          getSubFieldsData: ({ node }) => {
            return node?.fields
          },
          graphQLPopulationPromises: [blockPopulationPromiseHOC(wrapperBlockConfigs)],
          node: getWrapperBlockNode(domMap).WrapperBlockNode,
          validations: [blockValidationHOC(wrapperBlockConfigs)],
        }),
      ],
      sanitizedServerFeatureProps: _props,
    }
  },
  key: 'blocks',
})
