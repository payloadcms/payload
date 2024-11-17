'use client'

import type { BlocksFieldClient } from 'payload'

import { getTranslation } from '@payloadcms/translations'

import type { SlashMenuItem } from '../../../lexical/plugins/SlashMenu/LexicalTypeaheadMenuPlugin/types.js'
import type { ToolbarGroup, ToolbarGroupItem } from '../../toolbars/types.js'

import { BlockIcon } from '../../../lexical/ui/icons/Block/index.js'
import { InlineBlocksIcon } from '../../../lexical/ui/icons/InlineBlocks/index.js'
import { createClientFeature } from '../../../utilities/createClientFeature.js'
import { BlockNode } from './nodes/BlocksNode.js'
import { InlineBlockNode } from './nodes/InlineBlocksNode.js'
import { INSERT_BLOCK_COMMAND, INSERT_INLINE_BLOCK_COMMAND } from './plugin/commands.js'
import { BlocksPlugin } from './plugin/index.js'

export type BlocksFeatureClientProps = {
  clientBlockSlugs: string[]
  clientInlineBlockSlugs: string[]
}
// @ts-expect-error - TODO: fix this
export const BlocksFeatureClient = createClientFeature<BlocksFeatureClientProps>(({ props }) => ({
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
                label: ({ featureClientSchemaMap, i18n, schemaPath }) => {
                  if (!featureClientSchemaMap) {
                    return blockSlug
                  }

                  const componentMapRenderedBlockPath = `${schemaPath}.lexical_internal_feature.blocks.lexical_blocks.${blockSlug}`
                  const clientSchemaMap = featureClientSchemaMap['blocks']

                  const blocksField: BlocksFieldClient = clientSchemaMap[
                    componentMapRenderedBlockPath
                  ][0] as BlocksFieldClient

                  const clientBlock = blocksField.blocks[0]

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
        : null,
      props.clientInlineBlockSlugs?.length
        ? {
            items: props.clientInlineBlockSlugs.map((inlineBlockSlug) => {
              return {
                Icon: InlineBlocksIcon,
                key: 'inlineBlocks-' + inlineBlockSlug,
                keywords: ['inlineBlock', 'inline block', inlineBlockSlug],
                label: ({ featureClientSchemaMap, i18n, schemaPath }) => {
                  const componentMapRenderedBlockPath = `${schemaPath}.lexical_internal_feature.blocks.lexical_inline_blocks.${inlineBlockSlug}`
                  const clientSchemaMap = featureClientSchemaMap['blocks']

                  const blocksField: BlocksFieldClient = clientSchemaMap[
                    componentMapRenderedBlockPath
                  ][0] as BlocksFieldClient

                  const clientBlock = blocksField.blocks[0]

                  const blockDisplayName = clientBlock?.labels?.singular
                    ? getTranslation(clientBlock.labels.singular, i18n)
                    : clientBlock?.slug

                  return blockDisplayName
                },
                onSelect: ({ editor }) => {
                  editor.dispatchCommand(INSERT_INLINE_BLOCK_COMMAND, {
                    blockName: '',
                    blockType: inlineBlockSlug,
                  })
                },
              } as SlashMenuItem
            }),
            key: 'inlineBlocks',
            label: ({ i18n }) => {
              return i18n.t('lexical:blocks:inlineBlocks:label')
            },
          }
        : null,
    ].filter(Boolean),
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
                label: ({ featureClientSchemaMap, i18n, schemaPath }) => {
                  const componentMapRenderedBlockPath = `${schemaPath}.lexical_internal_feature.blocks.lexical_blocks.${blockSlug}`
                  const clientSchemaMap = featureClientSchemaMap['blocks']

                  const blocksField: BlocksFieldClient = clientSchemaMap[
                    componentMapRenderedBlockPath
                  ][0] as BlocksFieldClient

                  const clientBlock = blocksField.blocks[0]

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
        : null,
      props.clientInlineBlockSlugs?.length
        ? {
            type: 'dropdown',
            ChildComponent: InlineBlocksIcon,
            items: props.clientInlineBlockSlugs.map((inlineBlockSlug, index) => {
              return {
                ChildComponent: InlineBlocksIcon,
                isActive: undefined,
                key: 'inlineBlock-' + inlineBlockSlug,
                label: ({ featureClientSchemaMap, i18n, schemaPath }) => {
                  if (!featureClientSchemaMap) {
                    return inlineBlockSlug
                  }

                  const componentMapRenderedBlockPath = `${schemaPath}.lexical_internal_feature.blocks.lexical_inline_blocks.${inlineBlockSlug}`
                  const clientSchemaMap = featureClientSchemaMap['blocks']

                  const blocksField: BlocksFieldClient = clientSchemaMap[
                    componentMapRenderedBlockPath
                  ][0] as BlocksFieldClient

                  const clientBlock = blocksField.blocks[0]

                  const blockDisplayName = clientBlock?.labels?.singular
                    ? getTranslation(clientBlock.labels.singular, i18n)
                    : clientBlock?.slug

                  return blockDisplayName
                },
                onSelect: ({ editor }) => {
                  editor.dispatchCommand(INSERT_INLINE_BLOCK_COMMAND, {
                    blockName: '',
                    blockType: inlineBlockSlug,
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
}))
