import type { Block, BlockField, Field } from 'payload/types'

import { baseBlockFields, sanitizeFields } from 'payload/config'
import { fieldsToJSONSchema, formatLabels, getTranslation } from 'payload/utilities'

import type { FeatureProvider } from '../types'

import { SlashMenuOption } from '../../lexical/plugins/SlashMenu/LexicalTypeaheadMenuPlugin/types'
import { cloneDeep } from '../../lexical/utils/cloneDeep'
import { BlockNode } from './nodes/BlocksNode'
import { INSERT_BLOCK_COMMAND } from './plugin/commands'
import { blockPopulationPromiseHOC } from './populationPromise'
import { blockValidationHOC } from './validate'

export type BlocksFeatureProps = {
  blocks: Block[]
}

export const BlocksFeature = (props?: BlocksFeatureProps): FeatureProvider => {
  // Sanitization taken from payload/src/fields/config/sanitize.ts
  if (props?.blocks?.length) {
    props.blocks = props.blocks.map((block) => {
      const blockCopy = cloneDeep(block)

      blockCopy.fields = blockCopy.fields.concat(baseBlockFields)
      blockCopy.labels = !blockCopy.labels ? formatLabels(blockCopy.slug) : blockCopy.labels
      return blockCopy
    })
    //  unsanitizedBlock.fields are sanitized in the React component and not here.
    // That's because we do not have access to the payload config here.
  }
  return {
    feature: () => {
      return {
        generatedTypes: {
          modifyOutputSchema: ({
            collectionIDFieldTypes,
            config,
            currentSchema,
            field,
            interfaceNameDefinitions,
            payload,
          }) => {
            if (!props?.blocks?.length) {
              return currentSchema
            }

            // sanitize blocks
            const validRelationships = config?.collections?.map((c) => c.slug) || []

            const sanitizedBlocks = props.blocks.map((block) => {
              const blockCopy = cloneDeep(block)
              return {
                ...blockCopy,
                fields: sanitizeFields({
                  config,
                  fields: blockCopy.fields,
                  requireFieldLevelRichTextEditor: true,
                  validRelationships,
                }),
              }
            })

            const blocksField: BlockField = {
              name: field?.name + '_lexical_blocks',
              type: 'blocks',
              blocks: sanitizedBlocks,
            }

            // This is only done so that interfaceNameDefinitions sets those block's interfaceNames.
            // we don't actually use the JSON Schema itself in the generated types yet.
            fieldsToJSONSchema(
              collectionIDFieldTypes,
              [blocksField],
              interfaceNameDefinitions,
              payload,
              config,
            )

            return currentSchema
          },
        },
        nodes: [
          {
            type: BlockNode.getType(),
            node: BlockNode,
            populationPromises: [blockPopulationPromiseHOC(props)],
            validations: [blockValidationHOC(props)],
          },
        ],
        plugins: [
          {
            Component: () =>
              // @ts-expect-error
              import('./plugin').then((module) => module.BlocksPlugin),
            position: 'normal',
          },
        ],
        props,
        slashMenu: {
          options: [
            {
              displayName: 'Blocks',
              key: 'blocks',
              options: [
                ...props.blocks.map((block) => {
                  return new SlashMenuOption('block-' + block.slug, {
                    Icon: () =>
                      // @ts-expect-error
                      import('../../lexical/ui/icons/Block').then((module) => module.BlockIcon),
                    displayName: ({ i18n }) => {
                      return getTranslation(block.labels.singular, i18n)
                    },
                    keywords: ['block', 'blocks', block.slug],
                    onSelect: ({ editor }) => {
                      editor.dispatchCommand(INSERT_BLOCK_COMMAND, {
                        id: null,
                        blockName: '',
                        blockType: block.slug,
                      })
                    },
                  })
                }),
              ],
            },
          ],
        },
      }
    },
    key: 'blocks',
  }
}
