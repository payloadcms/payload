'use client'

import type { ReducedBlock } from '@payloadcms/ui/utilities/buildComponentMap'
import type { Block } from 'payload'

import { getTranslation } from '@payloadcms/translations'

import type { ToolbarGroup } from '../toolbars/types.js'

import { BlockIcon } from '../../lexical/ui/icons/Block/index.js'
import { InlineBlocksIcon } from '../../lexical/ui/icons/InlineBlocks/index.js'
import { createClientFeature } from '../../utilities/createClientFeature.js'
import { BlockNode } from './nodes/BlocksNode.js'
import { InlineBlockNode } from './nodes/InlineBlocksNode.js'
import { INSERT_BLOCK_COMMAND, OPEN_INLINE_BLOCK_DRAWER_COMMAND } from './plugin/commands.js'
import { BlocksPlugin } from './plugin/index.js'

export type ClientBlock = {
  LabelComponent?: Block['admin']['components']['Label']
} & ReducedBlock

export type BlocksFeatureClientProps = {
  reducedBlocks: ClientBlock[]
  reducedInlineBlocks: ClientBlock[]
}

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
      props.reducedBlocks?.length
        ? {
            items: props.reducedBlocks.map((block) => {
              return {
                Icon: BlockIcon,
                key: 'block-' + block.slug,
                keywords: ['block', 'blocks', block.slug],
                label: ({ i18n }) => {
                  if (!block.labels.singular) {
                    return block.slug
                  }

                  return getTranslation(block.labels.singular, i18n)
                },
                onSelect: ({ editor }) => {
                  editor.dispatchCommand(INSERT_BLOCK_COMMAND, {
                    id: null,
                    blockName: '',
                    blockType: block.slug,
                  })
                },
              }
            }),
            key: 'blocks',
            label: ({ i18n }) => {
              return i18n.t('lexical:blocks:label')
            },
          }
        : null,
      props.reducedInlineBlocks?.length
        ? {
            items: props.reducedInlineBlocks.map((inlineBlock) => {
              return {
                Icon: InlineBlocksIcon,
                key: 'inlineBlocks-' + inlineBlock.slug,
                keywords: ['inlineBlock', 'inline block', inlineBlock.slug],
                label: ({ i18n }) => {
                  if (!inlineBlock.labels.singular) {
                    return inlineBlock.slug
                  }

                  return getTranslation(inlineBlock.labels.singular, i18n)
                },
                onSelect: ({ editor }) => {
                  editor.dispatchCommand(OPEN_INLINE_BLOCK_DRAWER_COMMAND, {
                    fields: {
                      id: null,
                      blockName: '',
                      blockType: inlineBlock.slug,
                    },
                  })
                },
              }
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
      props.reducedBlocks?.length
        ? {
            type: 'dropdown',
            ChildComponent: BlockIcon,
            items: props.reducedBlocks.map((block, index) => {
              return {
                ChildComponent: BlockIcon,
                isActive: undefined, // At this point, we would be inside a sub-richtext-editor. And at this point this will be run against the focused sub-editor, not the parent editor which has the actual block. Thus, no point in running this
                key: 'block-' + block.slug,
                label: ({ i18n }) => {
                  if (!block.labels.singular) {
                    return block.slug
                  }

                  return getTranslation(block.labels.singular, i18n)
                },
                onSelect: ({ editor }) => {
                  editor.dispatchCommand(INSERT_BLOCK_COMMAND, {
                    id: null,
                    blockName: '',
                    blockType: block.slug,
                  })
                },
                order: index,
              }
            }),
            key: 'blocks',
            order: 20,
          }
        : null,
      props.reducedInlineBlocks?.length
        ? {
            type: 'dropdown',
            ChildComponent: InlineBlocksIcon,
            items: props.reducedInlineBlocks.map((inlineBlock, index) => {
              return {
                ChildComponent: InlineBlocksIcon,
                isActive: undefined,
                key: 'inlineBlock-' + inlineBlock.slug,
                label: ({ i18n }) => {
                  if (!inlineBlock.labels.singular) {
                    return inlineBlock.slug
                  }

                  return getTranslation(inlineBlock.labels.singular, i18n)
                },
                onSelect: ({ editor }) => {
                  editor.dispatchCommand(OPEN_INLINE_BLOCK_DRAWER_COMMAND, {
                    fields: {
                      blockType: inlineBlock.slug,
                    },
                  })
                },
                order: index,
              }
            }),
            key: 'inlineBlocks',
            order: 25,
          }
        : null,
    ].filter(Boolean) as ToolbarGroup[],
  },
}))
