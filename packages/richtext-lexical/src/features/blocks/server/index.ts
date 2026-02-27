import type {
  Block,
  BlocksField,
  BlockSlug,
  Config,
  FieldSchemaMap,
  FlattenedBlocksField,
  PayloadComponent,
  UIFieldClientProps,
  UIFieldServerProps,
} from 'payload'

import { fieldsToJSONSchema, flattenAllFields, sanitizeFields } from 'payload'

import { applyBaseFilterToFields } from '../../../utilities/applyBaseFilterToFields.js'
import { createServerFeature } from '../../../utilities/createServerFeature.js'
import { createNode } from '../../typeUtilities.js'
import { blockPopulationPromiseHOC } from './graphQLPopulationPromise.js'
import { i18n } from './i18n.js'
import { getBlockMarkdownTransformers } from './markdown/markdownTransformer.js'
import { ServerBlockNode } from './nodes/BlocksNode.js'
import { ServerInlineBlockNode } from './nodes/InlineBlocksNode.js'
import { blockValidationHOC } from './validate.js'

export type BlocksFeatureProps = {
  blocks?: (Block | BlockSlug)[] | Block[]
  inlineBlocks?: (Block | BlockSlug)[] | Block[]
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
      // Apply baseFilter to relationship fields in the block
      blockConfigs.push({
        ...block,
        fields: applyBaseFilterToFields(block.fields, _config),
      })
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
      // Apply baseFilter to relationship fields in the block
      inlineBlockConfigs.push({
        ...block,
        fields: applyBaseFilterToFields(block.fields, _config),
      })
    }

    return {
      ClientFeature: '@payloadcms/richtext-lexical/client#BlocksFeatureClient',
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

            // Lexical blocks aren't rows of a blocks field, so the normal renderFieldFn pipeline
            // that attaches custom components to row metadata doesn't run. This synthetic UI field
            // piggybacks on iterateFields → renderFieldFn to get RSC components into form state.
            if (block?.admin?.components) {
              const uiComponents: Record<string, PayloadComponent | undefined> = {}
              if (block.admin.components.Block) {
                uiComponents.Block = block.admin.components.Block
              }
              if (block.admin.components.Label) {
                uiComponents.BlockLabel = block.admin.components.Label
              }

              if (Object.keys(uiComponents).length > 0) {
                blockFields.unshift({
                  name: `_components`,
                  type: 'ui',
                  admin: {
                    components: uiComponents,
                  },
                })
              }
            }
            // Flat field list for iterateFields / RenderFields
            schemaMap.set(`lexical_blocks.${block.slug}.fields`, {
              fields: blockFields,
            })
            // Synthetic blocks-type entry so that we have access to the ClientBlock
            // in order to get the labels
            schemaMap.set(`lexical_blocks.${block.slug}`, {
              name: `lexical_blocks_${block.slug}`,
              type: 'blocks',
              blocks: [block],
            })
          }
        }

        if (inlineBlockConfigs?.length) {
          for (const block of inlineBlockConfigs) {
            const blockFields = [...block.fields]

            // Same synthetic UI field pattern as regular blocks above
            if (block?.admin?.components) {
              const uiComponents: Record<string, PayloadComponent | undefined> = {}
              if (block.admin.components.Block) {
                uiComponents.Block = block.admin.components.Block
              }
              if (block.admin.components.Label) {
                uiComponents.BlockLabel = block.admin.components.Label
              }

              if (Object.keys(uiComponents).length > 0) {
                blockFields.unshift({
                  name: `_components`,
                  type: 'ui',
                  admin: {
                    components: uiComponents,
                  },
                })
              }
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

        return schemaMap
      },
      i18n,
      markdownTransformers: getBlockMarkdownTransformers({
        blocks: blockConfigs,
        inlineBlocks: inlineBlockConfigs,
      }),

      nodes: [
        createNode({
          getSchemaPath: ({ node }) => {
            const blockType = node?.fields?.blockType
            return blockType ? `lexical_blocks.${blockType}.fields` : undefined
          },
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
            return block?.fields ?? null
          },
          getSubFieldsData: ({ node }) => {
            return node?.fields
          },
          graphQLPopulationPromises: [blockPopulationPromiseHOC(blockConfigs)],
          node: ServerBlockNode,
          validations: [blockValidationHOC(blockConfigs)],
        }),
        createNode({
          getSchemaPath: ({ node }) => {
            const blockType = node?.fields?.blockType
            return blockType ? `lexical_inline_blocks.${blockType}.fields` : undefined
          },
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
            return block?.fields ?? null
          },
          getSubFieldsData: ({ node }) => {
            return node?.fields
          },
          graphQLPopulationPromises: [blockPopulationPromiseHOC(inlineBlockConfigs)],
          node: ServerInlineBlockNode,
          validations: [blockValidationHOC(inlineBlockConfigs)],
        }),
      ],
      sanitizedServerFeatureProps: _props,
    }
  },
  key: 'blocks',
})

/**
 * Props for the client components provided to `admin.components.Block` of lexical blocks.
 */
export type LexicalBlockClientProps = UIFieldClientProps
/**
 * Props for the server components provided to `admin.components.Block` of lexical blocks.
 */
export type LexicalBlockServerProps = UIFieldServerProps

/**
 * Props for the client components provided to `admin.components.Label` of lexical blocks.
 */
export type LexicalBlockLabelClientProps = UIFieldClientProps
/**
 * Props for the server components provided to `admin.components.Label` of lexical blocks.
 */
export type LexicalBlockLabelServerProps = UIFieldServerProps

/**
 * Props for the client components provided to `admin.components.Block` of lexical inline blocks.
 */
export type LexicalInlineBlockClientProps = UIFieldClientProps
/**
 * Props for the server components provided to `admin.components.Block` of lexical inline blocks.
 */
export type LexicalInlineBlockServerProps = UIFieldServerProps

/**
 * Props for the client components provided to `admin.components.Label` of lexical inline blocks.
 */
export type LexicalInlineBlockLabelClientProps = UIFieldClientProps
/**
 * Props for the server components provided to `admin.components.Label` of lexical inline blocks.
 */
export type LexicalInlineBlockLabelServerProps = UIFieldServerProps
