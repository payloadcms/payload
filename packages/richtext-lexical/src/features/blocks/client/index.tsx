'use client'

import type { I18nClient } from '@payloadcms/translations'
import type { BlocksFieldClient, ClientBlock } from 'payload'

import { getTranslation } from '@payloadcms/translations'

import type {
  SlashMenuGroup,
  SlashMenuItem,
} from '../../../lexical/plugins/SlashMenu/LexicalTypeaheadMenuPlugin/types.js'
import type { ToolbarGroup, ToolbarGroupItem } from '../../toolbars/types.js'

import { BlockIcon } from '../../../lexical/ui/icons/Block/index.js'
import { InlineBlocksIcon } from '../../../lexical/ui/icons/InlineBlocks/index.js'
import { createClientFeature } from '../../../utilities/createClientFeature.js'
import { getBlockImageComponent } from './getBlockImageComponent.js'
import { BlockNode } from './nodes/BlocksNode.js'
import { InlineBlockNode } from './nodes/InlineBlocksNode.js'
import { INSERT_BLOCK_COMMAND, INSERT_INLINE_BLOCK_COMMAND } from './plugin/commands.js'
import { BlocksPlugin } from './plugin/index.js'
export const BlocksFeatureClient = createClientFeature(
  ({ config, featureClientSchemaMap, props, schemaPath }) => {
    const schemaMapRenderedBlockPathPrefix = `${schemaPath}.lexical_internal_feature.blocks.lexical_blocks`
    const schemaMapRenderedInlineBlockPathPrefix = `${schemaPath}.lexical_internal_feature.blocks.lexical_inline_blocks`
    const clientSchema = featureClientSchemaMap['blocks']

    if (!clientSchema) {
      return {}
    }

    const blocksFields: BlocksFieldClient[] = Object.entries(clientSchema)
      .filter(
        ([key]) =>
          key.startsWith(schemaMapRenderedBlockPathPrefix + '.') &&
          !key.replace(schemaMapRenderedBlockPathPrefix + '.', '').includes('.'),
      )
      .map(([, value]) => value[0] as BlocksFieldClient)

    const inlineBlocksFields: BlocksFieldClient[] = Object.entries(clientSchema)
      .filter(
        ([key]) =>
          key.startsWith(schemaMapRenderedInlineBlockPathPrefix + '.') &&
          !key.replace(schemaMapRenderedInlineBlockPathPrefix + '.', '').includes('.'),
      )
      .map(([, value]) => value[0] as BlocksFieldClient)

    const clientBlocks: ClientBlock[] = blocksFields
      .map((field) => {
        return field.blockReferences
          ? typeof field.blockReferences[0] === 'string'
            ? config.blocksMap[field.blockReferences[0]]
            : field.blockReferences[0]
          : field.blocks[0]
      })
      .filter((block) => block !== undefined)

    const clientInlineBlocks: ClientBlock[] = inlineBlocksFields
      .map((field) => {
        return field.blockReferences
          ? typeof field.blockReferences[0] === 'string'
            ? config.blocksMap[field.blockReferences[0]]
            : field.blockReferences[0]
          : field.blocks[0]
      })
      .filter((block) => block !== undefined)

    return {
      nodes: [BlockNode, InlineBlockNode],
      plugins: [
        {
          Component: BlocksPlugin,
          position: 'normal',
        },
      ],
      sanitizedClientFeatureProps: props,
      slashMenu: {
        groups: [
          clientBlocks?.length
            ? {
                items: clientBlocks.map((block) => {
                  return {
                    Icon: getBlockImageComponent(block.imageURL, block.imageAltText),
                    key: 'block-' + block.slug,
                    keywords: ['block', 'blocks', block.slug],
                    label: ({ i18n }) => {
                      const blockDisplayName = block?.labels?.singular
                        ? getTranslation(block.labels.singular, i18n)
                        : block?.slug

                      return blockDisplayName
                    },
                    onSelect: ({ editor }) => {
                      editor.dispatchCommand(INSERT_BLOCK_COMMAND, {
                        blockName: '',
                        blockType: block.slug,
                      })
                    },
                  } as SlashMenuItem
                }),
                key: 'blocks',
                label: ({ i18n }: { i18n: I18nClient<object, 'lexical:blocks:label'> }) => {
                  return i18n.t('lexical:blocks:label')
                },
              }
            : null,
          clientInlineBlocks?.length
            ? {
                items: clientInlineBlocks.map((inlineBlock) => {
                  return {
                    Icon: InlineBlocksIcon,
                    key: 'inlineBlocks-' + inlineBlock.slug,
                    keywords: ['inlineBlock', 'inline block', inlineBlock.slug],
                    label: ({ i18n }) => {
                      const blockDisplayName = inlineBlock?.labels?.singular
                        ? getTranslation(inlineBlock.labels.singular, i18n)
                        : inlineBlock?.slug

                      return blockDisplayName
                    },
                    onSelect: ({ editor }) => {
                      editor.dispatchCommand(INSERT_INLINE_BLOCK_COMMAND, {
                        blockName: '',
                        blockType: inlineBlock.slug,
                      })
                    },
                  } as SlashMenuItem
                }),
                key: 'inlineBlocks',
                label: ({
                  i18n,
                }: {
                  i18n: I18nClient<object, 'lexical:blocks:inlineBlocks:label'>
                }) => {
                  return i18n.t('lexical:blocks:inlineBlocks:label')
                },
              }
            : null,
        ].filter(Boolean) as SlashMenuGroup[],
      },
      toolbarFixed: {
        groups: [
          clientBlocks.length
            ? {
                type: 'dropdown',
                ChildComponent: BlockIcon,
                items: clientBlocks.map((block, index) => {
                  return {
                    ChildComponent: getBlockImageComponent(block.imageURL, block.imageAltText),
                    isActive: undefined, // At this point, we would be inside a sub-richtext-editor. And at this point this will be run against the focused sub-editor, not the parent editor which has the actual block. Thus, no point in running this
                    key: 'block-' + block.slug,
                    label: ({ i18n }) => {
                      const blockDisplayName = block?.labels?.singular
                        ? getTranslation(block.labels.singular, i18n)
                        : block?.slug

                      return blockDisplayName
                    },
                    onSelect: ({ editor }) => {
                      editor.dispatchCommand(INSERT_BLOCK_COMMAND, {
                        blockName: '',
                        blockType: block.slug,
                      })
                    },
                    order: index,
                  } as ToolbarGroupItem
                }),
                key: 'blocks',
                order: 20,
              }
            : null,
          clientInlineBlocks?.length
            ? {
                type: 'dropdown',
                ChildComponent: InlineBlocksIcon,
                items: clientInlineBlocks.map((inlineBlock, index) => {
                  return {
                    ChildComponent: inlineBlock.imageURL
                      ? getBlockImageComponent(inlineBlock.imageURL, inlineBlock.imageAltText)
                      : InlineBlocksIcon,
                    isActive: undefined,
                    key: 'inlineBlock-' + inlineBlock.slug,
                    label: ({ i18n }) => {
                      const blockDisplayName = inlineBlock?.labels?.singular
                        ? getTranslation(inlineBlock.labels.singular, i18n)
                        : inlineBlock?.slug

                      return blockDisplayName
                    },
                    onSelect: ({ editor }) => {
                      editor.dispatchCommand(INSERT_INLINE_BLOCK_COMMAND, {
                        blockName: '',
                        blockType: inlineBlock.slug,
                      })
                    },
                    order: index,
                  } as ToolbarGroupItem
                }),
                key: 'inlineBlocks',
                order: 25,
              }
            : null,
        ].filter(Boolean) as ToolbarGroup[],
      },
    }
  },
)
