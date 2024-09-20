'use client'

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
import { getBlockMarkdownTransformers } from './markdownTransformer.js'
import { BlockNode } from './nodes/BlocksNode.js'
import { InlineBlockNode } from './nodes/InlineBlocksNode.js'
import { INSERT_BLOCK_COMMAND, OPEN_INLINE_BLOCK_DRAWER_COMMAND } from './plugin/commands.js'
import { BlocksPlugin } from './plugin/index.js'

export type BlocksFeatureClientProps = {
  clientBlockSlugs: string[]
  clientInlineBlockSlugs: string[]
}

export const BlocksFeatureClient = createClientFeature<BlocksFeatureClientProps>(
  ({ field, props }) => {
    const richTextComponentMap = field?.richTextComponentMap

    const componentMapRenderedBlockPath = `lexical_internal_feature.blocks.fields.lexical_blocks`

    const blocksField: BlocksFieldClient = richTextComponentMap?.get(componentMapRenderedBlockPath)

    const clientBlocks: ClientBlock[] = blocksField ? blocksField[0].blocks : []

    return {
      markdownTransformers: getBlockMarkdownTransformers({
        blocks: clientBlocks, // TODO: Support inline blocks
      }),
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
          props.clientBlockSlugs?.length
            ? {
                items: props.clientBlockSlugs.map((blockSlug) => {
                  return {
                    Icon: BlockIcon,
                    key: 'block-' + blockSlug,
                    keywords: ['block', 'blocks', blockSlug],
                    label: ({ i18n, richTextComponentMap }) => {
                      if (!richTextComponentMap) {
                        return blockSlug
                      }

                      const componentMapRenderedBlockPath = `lexical_internal_feature.blocks.fields.lexical_blocks`
                      const blocksField: BlocksFieldClient = richTextComponentMap.get(
                        componentMapRenderedBlockPath,
                      )?.[0]

                      const clientBlock = blocksField.blocks.find(
                        (_block) => _block.slug === blockSlug,
                      )

                      const blockDisplayName = clientBlock?.labels?.singular
                        ? getTranslation(clientBlock.labels.singular, i18n)
                        : clientBlock?.slug

                      return blockDisplayName
                    },
                    onSelect: ({ editor }) => {
                      editor.dispatchCommand(INSERT_BLOCK_COMMAND, {
                        blockName: '',
                        blockType: blockSlug,
                      })
                    },
                  } as SlashMenuItem
                }),
                key: 'blocks',
                label: ({ i18n }) => {
                  return i18n.t('lexical:blocks:label')
                },
              }
            : false,
          props.clientInlineBlockSlugs?.length
            ? {
                items: props.clientInlineBlockSlugs.map((inlineBlockSlug) => {
                  return {
                    Icon: InlineBlocksIcon,
                    key: 'inlineBlocks-' + inlineBlockSlug,
                    keywords: ['inlineBlock', 'inline block', inlineBlockSlug],
                    label: ({ i18n, richTextComponentMap }) => {
                      if (!richTextComponentMap) {
                        return inlineBlockSlug
                      }

                      const componentMapRenderedBlockPath = `lexical_internal_feature.blocks.fields.lexical_inline_blocks`

                      const blocksField: BlocksFieldClient = richTextComponentMap.get(
                        componentMapRenderedBlockPath,
                      )?.[0]

                      const clientBlock = blocksField.blocks.find(
                        (_block) => _block.slug === inlineBlockSlug,
                      )

                      const blockDisplayName = clientBlock?.labels?.singular
                        ? getTranslation(clientBlock.labels.singular, i18n)
                        : clientBlock?.slug

                      return blockDisplayName
                    },
                    onSelect: ({ editor }) => {
                      editor.dispatchCommand(OPEN_INLINE_BLOCK_DRAWER_COMMAND, {
                        fields: {
                          blockName: '',
                          blockType: inlineBlockSlug,
                        },
                      })
                    },
                  } as SlashMenuItem
                }),
                key: 'inlineBlocks',
                label: ({ i18n }) => {
                  return i18n.t('lexical:blocks:inlineBlocks:label')
                },
              }
            : false,
        ].filter(Boolean) as SlashMenuGroup[],
      },
      toolbarFixed: {
        groups: [
          props.clientBlockSlugs?.length
            ? {
                type: 'dropdown',
                ChildComponent: BlockIcon,
                items: props.clientBlockSlugs.map((blockSlug, index) => {
                  return {
                    ChildComponent: BlockIcon,
                    isActive: undefined, // At this point, we would be inside a sub-richtext-editor. And at this point this will be run against the focused sub-editor, not the parent editor which has the actual block. Thus, no point in running this
                    key: 'block-' + blockSlug,
                    label: ({ i18n, richTextComponentMap }) => {
                      if (!richTextComponentMap) {
                        return blockSlug
                      }
                      const componentMapRenderedBlockPath = `lexical_internal_feature.blocks.fields.lexical_blocks`
                      const blocksField: BlocksFieldClient = richTextComponentMap.get(
                        componentMapRenderedBlockPath,
                      )?.[0]

                      const clientBlock = blocksField.blocks.find(
                        (_block) => _block.slug === blockSlug,
                      )

                      const blockDisplayName = clientBlock?.labels?.singular
                        ? getTranslation(clientBlock.labels.singular, i18n)
                        : clientBlock?.slug

                      return blockDisplayName
                    },
                    onSelect: ({ editor }) => {
                      editor.dispatchCommand(INSERT_BLOCK_COMMAND, {
                        blockName: '',
                        blockType: blockSlug,
                      })
                    },
                    order: index,
                  } as ToolbarGroupItem
                }),
                key: 'blocks',
                order: 20,
              }
            : undefined,
          props.clientInlineBlockSlugs?.length
            ? {
                type: 'dropdown',
                ChildComponent: InlineBlocksIcon,
                items: props.clientInlineBlockSlugs.map((inlineBlockSlug, index) => {
                  return {
                    ChildComponent: InlineBlocksIcon,
                    isActive: undefined,
                    key: 'inlineBlock-' + inlineBlockSlug,
                    label: ({ i18n, richTextComponentMap }) => {
                      if (!richTextComponentMap) {
                        return inlineBlockSlug
                      }

                      const componentMapRenderedBlockPath = `lexical_internal_feature.blocks.fields.lexical_inline_blocks`
                      const blocksField: BlocksFieldClient = richTextComponentMap.get(
                        componentMapRenderedBlockPath,
                      )?.[0]

                      const clientBlock = blocksField.blocks.find(
                        (_block) => _block.slug === inlineBlockSlug,
                      )

                      const blockDisplayName = clientBlock?.labels?.singular
                        ? getTranslation(clientBlock.labels.singular, i18n)
                        : clientBlock?.slug

                      return blockDisplayName
                    },
                    onSelect: ({ editor }) => {
                      editor.dispatchCommand(OPEN_INLINE_BLOCK_DRAWER_COMMAND, {
                        fields: {
                          blockType: inlineBlockSlug,
                        },
                      })
                    },
                    order: index,
                  } as ToolbarGroupItem
                }),
                key: 'inlineBlocks',
                order: 25,
              }
            : undefined,
        ].filter(Boolean) as ToolbarGroup[],
      },
    }
  },
)
